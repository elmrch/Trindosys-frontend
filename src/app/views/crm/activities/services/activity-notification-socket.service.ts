import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActivityNotification } from '../models/activity-notification.model';

/**
 * Socket dedicado de recordatorios de actividades (`/ws/activity-notifications`) —
 * canal propio, distinto al de la bandeja de conversaciones (`/ws/inbox`) y al del
 * tablero de oportunidades (`/ws/opportunities`), siguiendo el mismo patrón de
 * OpportunityBoardSocketService. Cada asesor solo recibe por este canal las
 * notificaciones dirigidas a él mismo (filtrado en el backend).
 *
 * NOTA: confirmar con backend el path exacto del endpoint WS si difiere de
 * `/ws/activity-notifications`.
 */
@Injectable({ providedIn: 'root' })
export class ActivityNotificationSocketService {
  private readonly authService = inject(AuthService);
  private socket: WebSocket | null = null;

  private readonly eventsSubject = new Subject<ActivityNotification>();
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
    const url = `${protocol}//${window.location.host}/ws/activity-notifications?token=${encodeURIComponent(token)}`;
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
        this.eventsSubject.next(JSON.parse(event.data) as ActivityNotification);
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
