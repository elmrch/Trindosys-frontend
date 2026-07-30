import { Component, computed, input, output, signal } from '@angular/core';
import { getInitials } from '../../../../../shared/utils/initials.util';
import { formatRelativeTime } from '../../../../../shared/utils/relative-time.util';
import { ConversationSummary } from '../../models/conversation.model';
import { ActiveAgentIndicator } from '../active-agent-indicator/active-agent-indicator';

@Component({
  selector: 'app-unified-inbox',
  imports: [ActiveAgentIndicator],
  templateUrl: './unified-inbox.html',
})
export class UnifiedInbox {
  readonly conversations = input.required<ConversationSummary[]>();
  readonly selectedId = input<number | null>(null);
  readonly select = output<ConversationSummary>();

  protected readonly searchTerm = signal('');

  protected readonly filteredConversations = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.conversations();
    return term ? list.filter((c) => c.customer.name.toLowerCase().includes(term)) : list;
  });

  protected readonly getInitials = getInitials;
  protected readonly formatRelativeTime = formatRelativeTime;
}
