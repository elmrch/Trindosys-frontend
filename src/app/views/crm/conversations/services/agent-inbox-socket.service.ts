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
        this.eventsSubject.next(JSON.parse(event.data) as AgentInboxEvent);
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
}
