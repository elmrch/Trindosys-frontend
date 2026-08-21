import { CurrencyPipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { Opportunity } from '../../models/opportunity.model';
import { PipelineStage } from '../../models/pipeline-stage.model';
import { OpportunityCard } from '../opportunity-card/opportunity-card';

const EDGE_THRESHOLD_PX = 90;
const SCROLL_STEP_PX = 24;

@Component({
  selector: 'app-kanban-board',
  imports: [OpportunityCard, CurrencyPipe],
  templateUrl: './kanban-board.html',
})
export class KanbanBoard {
  readonly opportunities = input.required<Opportunity[]>();
  readonly stages = input.required<PipelineStage[]>();
  readonly advisors = input<Advisor[]>([]);

  readonly openCard = output<Opportunity>();
  readonly moveStage = output<{ opportunity: Opportunity; stage: PipelineStage }>();
  readonly closeCard = output<{ opportunity: Opportunity; stage: PipelineStage }>();
  readonly deleteCard = output<Opportunity>();

  protected readonly dragOverStageId = signal<number | null>(null);
  protected readonly isPanning = signal(false);

  private draggingOpportunity: Opportunity | null = null;

  private panStartX = 0;
  private panStartScrollLeft = 0;
  private panContainer: HTMLElement | null = null;
  private panMoveListener: ((event: MouseEvent) => void) | null = null;
  private panUpListener: (() => void) | null = null;

  // Pan-to-scroll: clic sostenido en el fondo del tablero (no en una tarjeta
  // ni en un botón) y arrastrar desplaza el scroll horizontal, como en Trello.
  protected onPanStart(event: MouseEvent, container: HTMLElement): void {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('[draggable="true"], button, a, input, textarea, select')) {
      return;
    }

    event.preventDefault();
    this.isPanning.set(true);
    this.panContainer = container;
    this.panStartX = event.clientX;
    this.panStartScrollLeft = container.scrollLeft;

    this.panMoveListener = (moveEvent: MouseEvent) => {
      if (!this.panContainer) {
        return;
      }
      this.panContainer.scrollLeft = this.panStartScrollLeft - (moveEvent.clientX - this.panStartX);
    };

    this.panUpListener = () => this.stopPanning();

    document.addEventListener('mousemove', this.panMoveListener);
    document.addEventListener('mouseup', this.panUpListener);
  }

  private stopPanning(): void {
    this.isPanning.set(false);
    this.panContainer = null;
    if (this.panMoveListener) {
      document.removeEventListener('mousemove', this.panMoveListener);
      this.panMoveListener = null;
    }
    if (this.panUpListener) {
      document.removeEventListener('mouseup', this.panUpListener);
      this.panUpListener = null;
    }
  }

  protected columnOpportunities(stage: PipelineStage): Opportunity[] {
    return this.opportunities().filter((opportunity) => opportunity.stage.id === stage.id);
  }

  protected columnTotal(stage: PipelineStage): number {
    return this.columnOpportunities(stage).reduce((sum, opportunity) => sum + (opportunity.estimatedValue ?? 0), 0);
  }

  protected columnWeightedTotal(stage: PipelineStage): number {
    const probability = stage.probability ?? 0;
    return this.columnOpportunities(stage).reduce(
      (sum, opportunity) => sum + ((opportunity.estimatedValue ?? 0) * probability) / 100,
      0,
    );
  }

  protected stageBadgeClass(stage: PipelineStage): string {
    switch (stage.type) {
      case 'WON':
        return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
      case 'LOST':
        return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
      default:
        return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
    }
  }

  protected onDragStart(opportunity: Opportunity): void {
    this.draggingOpportunity = opportunity;
  }

  // Auto-scroll horizontal: al arrastrar una tarjeta cerca del borde
  // izquierdo/derecho del tablero, lo desplaza solo — así no hay que soltar
  // la tarjeta y usar la barra de scroll de abajo para llegar a otra columna.
  protected onBoardDragOver(event: DragEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const x = event.clientX;

    if (x - rect.left < EDGE_THRESHOLD_PX) {
      container.scrollLeft -= SCROLL_STEP_PX;
    } else if (rect.right - x < EDGE_THRESHOLD_PX) {
      container.scrollLeft += SCROLL_STEP_PX;
    }
  }

  protected onDragOver(stage: PipelineStage, event: DragEvent): void {
    event.preventDefault();
    this.dragOverStageId.set(stage.id);
  }

  protected onDragLeave(stage: PipelineStage): void {
    if (this.dragOverStageId() === stage.id) {
      this.dragOverStageId.set(null);
    }
  }

  protected onDrop(stage: PipelineStage, event: DragEvent): void {
    event.preventDefault();
    this.dragOverStageId.set(null);

    const opportunity = this.draggingOpportunity;
    this.draggingOpportunity = null;
    if (!opportunity || opportunity.stage.id === stage.id) {
      return;
    }

    if (stage.type === 'WON' || stage.type === 'LOST') {
      this.closeCard.emit({ opportunity, stage });
    } else {
      this.moveStage.emit({ opportunity, stage });
    }
  }
}
