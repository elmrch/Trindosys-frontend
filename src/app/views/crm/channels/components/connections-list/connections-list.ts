import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { ChannelConnectionWithChannel } from '../../models/channel.model';

type SortColumn = 'channel' | 'name' | 'externalId' | 'active' | 'createdAt';
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

  protected readonly sortColumn = signal<SortColumn>('createdAt');
  protected readonly sortDirection = signal<SortDirection>('desc');

  protected readonly sortedConnections = computed(() => {
    const column = this.sortColumn();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...this.connections()].sort((a, b) => {
      switch (column) {
        case 'channel':
          return a.channelName.localeCompare(b.channelName) * direction;
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'externalId':
          return a.externalId.localeCompare(b.externalId) * direction;
        case 'active':
          return (Number(a.active) - Number(b.active)) * direction;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
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
}
