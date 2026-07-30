import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { ConnectionForm } from './components/connection-form/connection-form';
import { ConnectionsList } from './components/connections-list/connections-list';
import { Channel, ChannelConnectionWithChannel } from './models/channel.model';
import { ChannelService } from './services/channel.service';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-channels',
  imports: [ConnectionsList, ConnectionForm],
  templateUrl: './channels.html',
})
export class Channels implements OnInit {
  private readonly channelService = inject(ChannelService);

  protected readonly channels = signal<Channel[]>([]);
  protected readonly connections = signal<ChannelConnectionWithChannel[]>([]);
  protected readonly selectedChannelId = signal(0);
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isFormOpen = signal(false);
  protected readonly editingConnection = signal<ChannelConnectionWithChannel | null>(null);

  protected readonly hasActiveFilters = computed(
    () => this.selectedChannelId() !== 0 || this.statusFilter() !== 'all' || this.searchTerm().trim() !== '',
  );

  protected readonly filteredConnections = computed(() => {
    const channelId = this.selectedChannelId();
    const status = this.statusFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.connections().filter((connection) => {
      if (channelId !== 0 && connection.channelId !== channelId) {
        return false;
      }
      if (status !== 'all' && connection.active !== (status === 'active')) {
        return false;
      }
      if (term && !connection.name.toLowerCase().includes(term) && !connection.externalId.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected loadAll(): void {
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

  protected onChannelFilterChange(value: string): void {
    this.selectedChannelId.set(Number(value));
  }

  protected onStatusFilterChange(value: string): void {
    this.statusFilter.set(value as StatusFilter);
  }

  protected clearFilters(): void {
    this.selectedChannelId.set(0);
    this.statusFilter.set('all');
    this.searchTerm.set('');
  }

  protected openCreateForm(): void {
    this.editingConnection.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(connection: ChannelConnectionWithChannel): void {
    this.editingConnection.set(connection);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingConnection.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.loadAll();
  }

  protected onDelete(connection: ChannelConnectionWithChannel): void {
    if (!confirm(`¿Eliminar la conexión "${connection.name}"?`)) {
      return;
    }
    this.channelService.deleteConnection(connection.id).subscribe({
      next: () => this.loadAll(),
      error: () => this.errorMessage.set('No se pudo eliminar la conexión.'),
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
