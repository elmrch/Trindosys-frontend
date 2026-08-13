import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Advisor } from '../../../shared/models/advisor.model';
import { AdvisorService } from '../../../shared/services/advisor.service';
import { Customer } from '../customers/models/customer.model';
import { CustomerService } from '../customers/services/customer.service';
import { KanbanBoard } from './components/kanban-board/kanban-board';
import { OpportunityDetail } from './components/opportunity-detail/opportunity-detail';
import { PipelineStageManager } from './components/pipeline-stage-manager/pipeline-stage-manager';
import { Opportunity, OpportunityBoardEvent } from './models/opportunity.model';
import { PipelineStage } from './models/pipeline-stage.model';
import { OpportunityBoardSocketService } from './services/opportunity-board-socket.service';
import { OpportunityService } from './services/opportunity.service';
import { PipelineStageService } from './services/pipeline-stage.service';

const BOARD_EVENT_TYPES = ['opportunity_created', 'opportunity_updated', 'opportunity_stage_changed'];

@Component({
  selector: 'app-opportunities',
  imports: [KanbanBoard, OpportunityDetail, PipelineStageManager],
  templateUrl: './opportunities.html',
})
export class Opportunities implements OnInit {
  private readonly opportunityService = inject(OpportunityService);
  private readonly pipelineStageService = inject(PipelineStageService);
  private readonly customerService = inject(CustomerService);
  private readonly advisorService = inject(AdvisorService);
  private readonly socket = inject(OpportunityBoardSocketService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly opportunities = signal<Opportunity[]>([]);
  protected readonly stages = signal<PipelineStage[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly advisors = signal<Advisor[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  protected readonly isFormOpen = signal(false);
  protected readonly editingOpportunity = signal<Opportunity | null>(null);
  protected readonly isStageManagerOpen = signal(false);

  protected readonly closingOpportunity = signal<Opportunity | null>(null);
  protected readonly closingStage = signal<PipelineStage | null>(null);
  protected readonly lossReason = signal('');
  protected readonly isClosing = signal(false);

  protected readonly filterAdvisorId = signal<string>('');
  protected readonly filterFrom = signal<string>('');
  protected readonly filterTo = signal<string>('');

  ngOnInit(): void {
    this.loadStages();
    this.loadOpportunities();
    this.customerService.list(0, 100).subscribe({ next: (page) => this.customers.set(page.content) });
    this.advisorService.list().subscribe({ next: (advisors) => this.advisors.set(advisors) });

    this.socket.connect();
    this.socket.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => this.onBoardEvent(event));
    this.destroyRef.onDestroy(() => this.socket.disconnect());
  }

  protected loadStages(): void {
    this.pipelineStageService.list().subscribe({
      next: (stages) => this.stages.set(stages),
      error: () => this.errorMessage.set('No se pudieron cargar las etapas del pipeline.'),
    });
  }

  protected loadOpportunities(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const advisorId = this.filterAdvisorId() ? Number(this.filterAdvisorId()) : undefined;
    const from = this.filterFrom() ? new Date(`${this.filterFrom()}T00:00:00`).toISOString() : undefined;
    const to = this.filterTo() ? new Date(`${this.filterTo()}T23:59:59`).toISOString() : undefined;

    this.opportunityService.list(undefined, advisorId, from, to).subscribe({
      next: (list) => {
        this.opportunities.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar las oportunidades.');
      },
    });
  }

  protected onFilterChange(): void {
    this.loadOpportunities();
  }

  protected clearFilters(): void {
    this.filterAdvisorId.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.loadOpportunities();
  }

  protected openCreateForm(): void {
    this.editingOpportunity.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(opportunity: Opportunity): void {
    this.editingOpportunity.set(opportunity);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingOpportunity.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.loadOpportunities();
  }

  protected openStageManager(): void {
    this.isStageManagerOpen.set(true);
  }

  protected closeStageManager(): void {
    this.isStageManagerOpen.set(false);
  }

  protected onStagesChanged(): void {
    this.loadStages();
    this.loadOpportunities();
  }

  protected onMoveStage(payload: { opportunity: Opportunity; stage: PipelineStage }): void {
    this.opportunityService.moveStage(payload.opportunity.id, payload.stage.id).subscribe({
      next: (updated) => this.upsertOpportunity(updated),
      error: () => this.errorMessage.set('No se pudo mover la oportunidad.'),
    });
  }

  protected onRequestClose(payload: { opportunity: Opportunity; stage: PipelineStage }): void {
    this.closingOpportunity.set(payload.opportunity);
    this.closingStage.set(payload.stage);
    this.lossReason.set('');
  }

  protected cancelClose(): void {
    this.closingOpportunity.set(null);
    this.closingStage.set(null);
  }

  protected confirmClose(): void {
    const opportunity = this.closingOpportunity();
    const stage = this.closingStage();
    if (!opportunity || !stage) {
      return;
    }

    this.isClosing.set(true);
    const lossReason = stage.type === 'LOST' ? this.lossReason().trim() || null : null;

    this.opportunityService.close(opportunity.id, stage.id, lossReason).subscribe({
      next: (updated) => {
        this.isClosing.set(false);
        this.upsertOpportunity(updated);
        this.cancelClose();
      },
      error: () => {
        this.isClosing.set(false);
        this.errorMessage.set('No se pudo cerrar la oportunidad.');
      },
    });
  }

  private onBoardEvent(event: OpportunityBoardEvent): void {
    if (!BOARD_EVENT_TYPES.includes(event.type)) {
      return;
    }
    this.upsertOpportunity(event.opportunity);
  }

  private upsertOpportunity(opportunity: Opportunity): void {
    this.opportunities.update((list) => {
      const exists = list.some((o) => o.id === opportunity.id);
      return exists ? list.map((o) => (o.id === opportunity.id ? opportunity : o)) : [...list, opportunity];
    });
  }
}
