import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';

interface RealtimeEvent {
  type: string;
}

/**
 * Socket único de agentes (`/ws/inbox`) — el backend multiplexa por él distintos
 * tipos de eventos (mensajes nuevos, asignación de conversaciones, cambios en el
 * pipeline de oportunidades, etc.), cada uno con su propio `type`. Cada feature
 * castea el payload al tipo que le corresponde y filtra por `type`.
 */
@Injectable({ providedIn: 'root' })
export class AgentInboxSocketService {
  private readonly authService = inject(AuthService);
  private socket: WebSocket | null = null;

  private readonly eventsSubject = new Subject<RealtimeEvent>();
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
        const payload = JSON.parse(event.data) as RealtimeEvent;
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
