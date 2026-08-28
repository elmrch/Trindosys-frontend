import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { ChannelConnectionWithChannel } from '../../models/channel.model';

type SortColumn = 'name' | 'provider' | 'externalId' | 'active' | 'createdAt';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-connections-list',
  imports: [DatePipe],
  templateUrl: './connections-list.html',
})
export class ConnectionsList {
  readonly connections = input.required<ChannelConnectionWithChannel[]>();
  readonly edit = output<ChannelConnectionWithChannel>();
  readonly delete = output<ChannelConnectionWithChannel>();
  readonly connectEvolution = output<ChannelConnectionWithChannel>();
  readonly disconnectEvolution = output<ChannelConnectionWithChannel>();
  readonly deleteEvolution = output<ChannelConnectionWithChannel>();

  protected readonly sortColumn = signal<SortColumn>('createdAt');
  protected readonly sortDirection = signal<SortDirection>('desc');

  protected readonly sortedConnections = computed(() => {
    const column = this.sortColumn();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...this.connections()].sort((a, b) => {
      switch (column) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'provider':
          return (a.provider ?? '').localeCompare(b.provider ?? '') * direction;
        case 'externalId':
          return a.externalId.localeCompare(b.externalId) * direction;
        case 'active':
          return (Number(a.active) - Number(b.active)) * direction;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
        default:
          return 0;
      }
    });
  });

  protected onSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  protected sortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return '↕';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected isEvolutionApi(connection: ChannelConnectionWithChannel): boolean {
    return connection.provider === 'evolution-api';
  }

  protected providerLabel(provider: string | undefined): string {
    if (provider === 'evolution-api') return 'Evolution API (QR)';
    if (provider === 'meta-cloud-api') return 'Meta Cloud API';
    return provider ?? 'N/A';
  }
}
