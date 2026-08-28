import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { ConnectionForm } from './components/connection-form/connection-form';
import { ConnectionsList } from './components/connections-list/connections-list';
import { EvolutionQrModal } from './components/evolution-qr-modal/evolution-qr-modal';
import {
  Channel,
  ChannelConnectionWithChannel,
  ChannelProvider,
  EvolutionStatusResponse,
  INTEGRATION_CARDS,
  IntegrationCard,
} from './models/channel.model';
import { ChannelService } from './services/channel.service';
import { EvolutionService } from './services/evolution.service';

@Component({
  selector: 'app-channels',
  imports: [ConnectionsList, ConnectionForm, EvolutionQrModal],
  templateUrl: './channels.html',
})
export class Channels implements OnInit {
  private readonly channelService = inject(ChannelService);
  private readonly evolutionService = inject(EvolutionService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly integrationCards = signal<IntegrationCard[]>(INTEGRATION_CARDS);
  protected readonly channels = signal<Channel[]>([]);
  protected readonly connections = signal<ChannelConnectionWithChannel[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly selectedIntegration = signal<IntegrationCard | null>(null);

  protected readonly isFormOpen = signal(false);
  protected readonly editingConnection = signal<ChannelConnectionWithChannel | null>(null);
  protected readonly preselectedChannelId = signal<number | null>(null);
  protected readonly preselectedProvider = signal<ChannelProvider | null>(null);

  protected readonly isQrModalOpen = signal(false);
  protected readonly qrModalConnectionId = signal<number | null>(null);
  protected readonly qrModalConnectionName = signal('');

  protected readonly connectionsForSelectedIntegration = computed(() => {
    const integration = this.selectedIntegration();
    if (!integration) return [];
    const channel = this.channels().find((c) => c.code === integration.channelCode);
    if (!channel) return [];
    return this.connections().filter(
      (c) => c.channelId === channel.id && c.provider === integration.provider,
    );
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected getConnectionsForCard(card: IntegrationCard): ChannelConnectionWithChannel[] {
    const channel = this.channels().find((c) => c.code === card.channelCode);
    if (!channel) return [];
    return this.connections().filter(
      (c) => c.channelId === channel.id && c.provider === card.provider,
    );
  }

  protected getConnectionCountForCard(card: IntegrationCard): number {
    return this.getConnectionsForCard(card).length;
  }

  protected openCreateForm(): void {
    this.editingConnection.set(null);
    this.preselectedChannelId.set(null);
    this.preselectedProvider.set(null);
    this.isFormOpen.set(true);
  }

  protected openCreateFormForIntegration(integration: IntegrationCard): void {
    const channel = this.channels().find((c) => c.code === integration.channelCode);
    this.editingConnection.set(null);
    this.preselectedChannelId.set(channel?.id ?? null);
    this.preselectedProvider.set(integration.provider);
    this.isFormOpen.set(true);
  }

  protected openEditForm(connection: ChannelConnectionWithChannel): void {
    this.editingConnection.set(connection);
    this.preselectedChannelId.set(null);
    this.preselectedProvider.set(null);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingConnection.set(null);
    this.preselectedChannelId.set(null);
    this.preselectedProvider.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.loadAll();
  }

  protected onDelete(connection: ChannelConnectionWithChannel): void {
    this.sweetAlert
      .confirm(`¿Eliminar la conexión "${connection.name}"?`, 'Esta acción no se puede deshacer.', 'Sí, eliminar')
      .then((result) => {
        if (!result.isConfirmed) return;
        this.channelService.deleteConnection(connection.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Conexión eliminada.');
            this.loadAll();
          },
          error: () => this.sweetAlert.error('No se pudo eliminar la conexión.'),
        });
      });
  }

  protected onConnectEvolution(connection: ChannelConnectionWithChannel): void {
    this.qrModalConnectionId.set(connection.id);
    this.qrModalConnectionName.set(connection.name);
    this.isQrModalOpen.set(true);
  }

  protected closeQrModal(): void {
    this.isQrModalOpen.set(false);
    this.qrModalConnectionId.set(null);
    this.qrModalConnectionName.set('');
  }

  protected onQrConnected(_data: EvolutionStatusResponse): void {
    this.closeQrModal();
    this.sweetAlert.toast('WhatsApp conectado exitosamente.');
    this.loadAll();
  }

  protected onDisconnectEvolution(connection: ChannelConnectionWithChannel): void {
    this.sweetAlert
      .confirm(
        '¿Cerrar sesión de WhatsApp?',
        'La sesión de WhatsApp se cerrará. Para reconectar, deberás escanear un nuevo código QR. La instancia y su configuración se mantendrán.',
        'Cerrar sesión',
      )
      .then((result) => {
        if (!result.isConfirmed) return;
        this.evolutionService.disconnect(connection.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Sesión cerrada. Puedes reconectar escaneando un nuevo QR.');
            this.loadAll();
          },
          error: () => this.sweetAlert.error('No se pudo cerrar la sesión.'),
        });
      });
  }

  protected onDeleteEvolution(connection: ChannelConnectionWithChannel): void {
    this.sweetAlert
      .confirm(
        '¿Eliminar instancia de WhatsApp?',
        'Se eliminará la instancia completa de Evolution API. Esta acción no se puede deshacer. Para volver a conectar, deberás crear una nueva conexión desde cero.',
        'Eliminar',
      )
      .then((result) => {
        if (!result.isConfirmed) return;
        this.evolutionService.deleteInstance(connection.id).subscribe({
          next: () => {
            this.sweetAlert.toast('Instancia eliminada.');
            this.loadAll();
          },
          error: () => this.sweetAlert.error('No se pudo eliminar la instancia.'),
        });
      });
  }

  private loadAll(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.channelService.getChannels().subscribe({
      next: (channels) => {
        this.channels.set(channels);
        this.loadConnections(channels);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los canales.');
      },
    });
  }

  private loadConnections(channels: Channel[]): void {
    if (channels.length === 0) {
      this.connections.set([]);
      this.isLoading.set(false);
      return;
    }

    const requests = channels.map((channel) =>
      this.channelService
        .getConnections(channel.id)
        .pipe(map((list) => list.map((conn) => ({ ...conn, channelId: channel.id, channelName: channel.name })))),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.connections.set(results.flat());
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar las conexiones.');
      },
    });
  }
}
