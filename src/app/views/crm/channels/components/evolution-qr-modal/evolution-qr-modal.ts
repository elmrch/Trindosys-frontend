import { Component, EventEmitter, inject, input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { EvolutionStatusResponse } from '../../models/channel.model';
import { EvolutionService } from '../../services/evolution.service';

type QrStatus = 'loading' | 'connecting' | 'open' | 'error';

@Component({
  selector: 'app-evolution-qr-modal',
  templateUrl: './evolution-qr-modal.html',
})
export class EvolutionQrModal implements OnInit, OnDestroy {
  private readonly evolutionService = inject(EvolutionService);

  readonly connectionId = input.required<number>();
  readonly connectionName = input.required<string>();

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly connected = new EventEmitter<EvolutionStatusResponse>();

  protected readonly status = signal<QrStatus>('loading');
  protected readonly qrBase64 = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly connectedData = signal<EvolutionStatusResponse | null>(null);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startConnection();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  protected close(): void {
    this.stopPolling();
    this.closed.emit();
  }

  protected startConnection(): void {
    this.status.set('loading');
    this.evolutionService.connect(this.connectionId()).subscribe({
      next: (response) => {
        if (response.status === 'open') {
          this.handleConnected();
        } else {
          this.status.set('connecting');
          this.qrBase64.set(response.qrcode?.base64 ?? null);
          this.startPolling();
        }
      },
      error: () => {
        this.status.set('error');
        this.errorMessage.set('Error al conectar con Evolution API.');
      },
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.evolutionService.getStatus(this.connectionId()).subscribe({
        next: (statusResponse) => {
          if (statusResponse.status === 'open') {
            this.handleConnected();
          } else if (statusResponse.status === 'close') {
            this.status.set('error');
            this.errorMessage.set('La conexión se cerró. Intenta conectar nuevamente.');
            this.stopPolling();
          }
        },
        error: () => {
          // Ignorar errores de red temporales durante polling
        },
      });
    }, 3000);
  }

  private handleConnected(): void {
    this.stopPolling();
    this.status.set('open');
    this.evolutionService.getStatus(this.connectionId()).subscribe({
      next: (data) => {
        this.connectedData.set(data);
        this.connected.emit(data);
      },
      error: () => {
        this.connectedData.set(null);
        this.connected.emit({} as EvolutionStatusResponse);
      },
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
