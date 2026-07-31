import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { AgentInboxEvent } from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class AgentInboxSocketService {
  private readonly authService = inject(AuthService);
  private socket: WebSocket | null = null;

  private readonly eventsSubject = new Subject<AgentInboxEvent>();
  readonly events$ = this.eventsSubject.asObservable();
  readonly isConnected = signal(false);
  readonly unreadCount = signal(0);

  connect(): void {
    if (this.socket) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/inbox?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);

    socket.onopen = () => this.isConnected.set(true);

    socket.onclose = () => {
      this.isConnected.set(false);
      this.socket = null;
    };

    socket.onerror = () => {
      this.isConnected.set(false);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as AgentInboxEvent;
        if (payload.type === 'new_message') {
          this.unreadCount.update((count) => count + 1);
        }
        this.eventsSubject.next(payload);
      } catch {
        // Ignore malformed payloads.
      }
    };

    this.socket = socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.isConnected.set(false);
  }

  markAllRead(): void {
    this.unreadCount.set(0);
  }
}
