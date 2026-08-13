import { Component, computed, input, output, signal } from '@angular/core';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { getInitials } from '../../../../../shared/utils/initials.util';
import { formatRelativeTime } from '../../../../../shared/utils/relative-time.util';
import { ConversationStatus, ConversationSummary } from '../../models/conversation.model';
import { ActiveAgentIndicator } from '../active-agent-indicator/active-agent-indicator';

const STATUS_FILTERS: { label: string; value: ConversationStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Abiertas', value: 'OPEN' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Resueltas', value: 'CLOSED' },
];

@Component({
  selector: 'app-unified-inbox',
  imports: [ActiveAgentIndicator],
  templateUrl: './unified-inbox.html',
})
export class UnifiedInbox {
  readonly conversations = input.required<ConversationSummary[]>();
  readonly selectedId = input<number | null>(null);
  readonly advisors = input<Advisor[]>([]);
  readonly canAssign = input(false);
  readonly currentAdvisorId = input<number | null>(null);
  readonly statusFilter = input<ConversationStatus | ''>('');
  readonly onlyMine = input(false);

  readonly select = output<ConversationSummary>();
  readonly assign = output<{ conversation: ConversationSummary; advisorId: number | null }>();
  readonly statusFilterChange = output<ConversationStatus | ''>();
  readonly onlyMineToggle = output<void>();

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly searchTerm = signal('');

  protected readonly filteredConversations = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.conversations();
    return term ? list.filter((c) => c.customer.name.toLowerCase().includes(term)) : list;
  });

  protected readonly getInitials = getInitials;
  protected readonly formatRelativeTime = formatRelativeTime;

  protected onAssign(conversation: ConversationSummary, advisorId: number | null): void {
    this.assign.emit({ conversation, advisorId });
  }

  protected statusLabel(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Abierta';
      case 'PENDING':
        return 'Pendiente';
      case 'CLOSED':
        return 'Resuelta';
      default:
        return status;
    }
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-500';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400';
      default:
        return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
    }
  }
}
