import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
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
  private readonly sweetAlert = inject(SweetAlertService);
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
  protected readonly activeDropdown = signal<'advisor' | 'from' | 'to' | 'more' | null>(null);

  protected readonly selectedAdvisorName = computed(() => {
    const id = this.filterAdvisorId();
    if (!id) {
      return 'Todos';
    }
    const advisor = this.advisors().find((a) => String(a.id) === id);
    return advisor ? advisor.fullName : `Asesor #${id}`;
  });

  protected readonly selectedFromLabel = computed(() => {
    const from = this.filterFrom();
    if (!from) {
      return 'Cualquier fecha';
    }
    const parts = from.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return from;
  });

  protected readonly selectedToLabel = computed(() => {
    const to = this.filterTo();
    if (!to) {
      return 'Cualquier fecha';
    }
    const parts = to.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return to;
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!(this.filterAdvisorId() || this.filterFrom() || this.filterTo());
  });

  ngOnInit(): void {
    this.loadStages();
    this.loadOpportunities();
    this.customerService.list(0, 100).subscribe({ next: (page) => this.customers.set(page.content) });
    this.advisorService.list().subscribe({ next: (advisors) => this.advisors.set(advisors) });

    this.socket.connect();
    this.socket.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => this.onBoardEvent(event));
    this.destroyRef.onDestroy(() => this.socket.disconnect());
  }

  protected toggleDropdown(name: 'advisor' | 'from' | 'to' | 'more'): void {
    this.activeDropdown.update((current) => (current === name ? null : name));
  }

  protected closeDropdown(): void {
    this.activeDropdown.set(null);
  }

  protected selectAdvisor(advisorId: string): void {
    this.filterAdvisorId.set(advisorId);
    this.closeDropdown();
    this.onFilterChange();
  }

  protected clearFilterField(field: 'advisor' | 'from' | 'to', event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (field === 'advisor') {
      this.filterAdvisorId.set('');
    } else if (field === 'from') {
      this.filterFrom.set('');
    } else if (field === 'to') {
      this.filterTo.set('');
    }
    this.onFilterChange();
  }

  protected selectDatePreset(preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all'): void {
    const now = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      this.filterFrom.set('');
      this.filterTo.set('');
    } else if (preset === 'today') {
      const todayStr = formatDate(now);
      this.filterFrom.set(todayStr);
      this.filterTo.set(todayStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yestStr = formatDate(yesterday);
      this.filterFrom.set(yestStr);
      this.filterTo.set(yestStr);
    } else if (preset === 'this_week') {
      const firstDay = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      firstDay.setDate(diff);
      this.filterFrom.set(formatDate(firstDay));
      this.filterTo.set(formatDate(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filterFrom.set(formatDate(firstDay));
      this.filterTo.set(formatDate(now));
    }

    this.closeDropdown();
    this.onFilterChange();
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
    this.closeDropdown();
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

  protected async onDeleteOpportunity(opportunity: Opportunity): Promise<void> {
    const result = await this.sweetAlert.confirm(
      '¿Eliminar oportunidad?',
      `Se eliminará la oportunidad de "${opportunity.customer.name}". Esta acción no se puede deshacer.`,
      'Sí, eliminar',
    );
    if (!result.isConfirmed) {
      return;
    }

    this.opportunityService.delete(opportunity.id).subscribe({
      next: () => {
        this.opportunities.update((list) => list.filter((o) => o.id !== opportunity.id));
        this.sweetAlert.toast('Oportunidad eliminada');
      },
      error: () => this.errorMessage.set('No se pudo eliminar la oportunidad.'),
    });
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
