import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { OpportunityBoardEvent } from '../models/opportunity.model';

/**
 * Socket dedicado del tablero de oportunidades (`/ws/opportunities`) — es un
 * canal distinto al de la bandeja de conversaciones (`/ws/inbox`), así que
 * vive con su propia conexión en vez de reusar AgentInboxSocketService.
 */
@Injectable({ providedIn: 'root' })
export class OpportunityBoardSocketService {
  private readonly authService = inject(AuthService);
  private socket: WebSocket | null = null;

  private readonly eventsSubject = new Subject<OpportunityBoardEvent>();
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
    const url = `${protocol}//${window.location.host}/ws/opportunities?token=${encodeURIComponent(token)}`;
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
        this.eventsSubject.next(JSON.parse(event.data) as OpportunityBoardEvent);
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
