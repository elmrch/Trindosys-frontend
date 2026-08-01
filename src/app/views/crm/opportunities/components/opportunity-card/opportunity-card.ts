import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { ActiveAgentIndicator } from '../../../conversations/components/active-agent-indicator/active-agent-indicator';
import { Opportunity } from '../../models/opportunity.model';

@Component({
  selector: 'app-opportunity-card',
  imports: [CurrencyPipe, DatePipe, ActiveAgentIndicator],
  templateUrl: './opportunity-card.html',
})
export class OpportunityCard {
  readonly opportunity = input.required<Opportunity>();
  readonly advisors = input<Advisor[]>([]);

  readonly open = output<Opportunity>();
  readonly dragStart = output<Opportunity>();

  protected onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', String(this.opportunity().id));
    event.dataTransfer!.effectAllowed = 'move';
    this.dragStart.emit(this.opportunity());
  }
}
