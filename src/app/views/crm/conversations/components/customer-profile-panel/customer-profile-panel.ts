import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { Activity } from '../../../activities/models/activity.model';
import { ActivityService } from '../../../activities/services/activity.service';
import { Customer } from '../../../customers/models/customer.model';
import { CustomerService } from '../../../customers/services/customer.service';
import { Opportunity } from '../../../opportunities/models/opportunity.model';
import { PipelineStage } from '../../../opportunities/models/pipeline-stage.model';
import { OpportunityService } from '../../../opportunities/services/opportunity.service';
import { PipelineStageService } from '../../../opportunities/services/pipeline-stage.service';

@Component({
  selector: 'app-customer-profile-panel',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  templateUrl: './customer-profile-panel.html',
})
export class CustomerProfilePanel implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly activityService = inject(ActivityService);
  private readonly opportunityService = inject(OpportunityService);
  private readonly pipelineStageService = inject(PipelineStageService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly customerId = input<number | null>(null);

  protected readonly customer = signal<Customer | null>(null);
  protected readonly opportunities = signal<Opportunity[]>([]);
  protected readonly stages = signal<PipelineStage[]>([]);
  protected readonly updatingOpportunityId = signal<number | null>(null);
  protected readonly notes = signal<Activity[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly newTag = signal('');
  protected readonly isSavingTags = signal(false);

  protected readonly newNote = signal('');
  protected readonly isSavingNote = signal(false);

  ngOnInit(): void {
    this.pipelineStageService.list().subscribe({
      next: (stages) => this.stages.set(stages),
    });
  }

  constructor() {
    effect(() => {
      const id = this.customerId();
      if (id === null) {
        this.customer.set(null);
        this.opportunities.set([]);
        this.notes.set([]);
        return;
      }
      this.load(id);
    });
  }

  private load(customerId: number): void {
    this.isLoading.set(true);
    this.customerService.get(customerId).subscribe({ next: (customer) => this.customer.set(customer) });
    this.customerService.getOpportunities(customerId).subscribe({
      next: (opportunities) => {
        this.opportunities.set(opportunities);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
    this.activityService.timeline(customerId, 'NOTE').subscribe({ next: (notes) => this.notes.set(notes) });
  }

  protected isOpenOpportunity(opportunity: Opportunity): boolean {
    return opportunity.stage.type === 'OPEN';
  }

  protected onStageChange(opportunity: Opportunity, targetStageId: string | number): void {
    const stageId = Number(targetStageId);
    if (!stageId || opportunity.stage.id === stageId) {
      return;
    }

    this.updatingOpportunityId.set(opportunity.id);
    this.opportunityService.moveStage(opportunity.id, stageId).subscribe({
      next: (updated) => {
        this.updatingOpportunityId.set(null);
        this.opportunities.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.sweetAlert.toast('Etapa de oportunidad actualizada.');
      },
      error: () => {
        this.updatingOpportunityId.set(null);
        this.sweetAlert.error('No se pudo cambiar la etapa de la oportunidad.');
      },
    });
  }

  protected addTag(): void {
    const customer = this.customer();
    const tag = this.newTag().trim();
    if (!customer || !tag || customer.tags.includes(tag)) {
      this.newTag.set('');
      return;
    }
    this.saveTags(customer, [...customer.tags, tag]);
  }

  protected removeTag(tag: string): void {
    const customer = this.customer();
    if (!customer) {
      return;
    }
    this.saveTags(
      customer,
      customer.tags.filter((existing) => existing !== tag),
    );
  }

  private saveTags(customer: Customer, tags: string[]): void {
    this.isSavingTags.set(true);
    this.customerService.updateTags(customer.id, tags).subscribe({
      next: (updated) => {
        this.customer.set(updated);
        this.newTag.set('');
        this.isSavingTags.set(false);
      },
      error: () => this.isSavingTags.set(false),
    });
  }

  protected addNote(): void {
    const customer = this.customer();
    const content = this.newNote().trim();
    if (!customer || !content) {
      return;
    }

    this.isSavingNote.set(true);
    this.activityService.createNote(customer.id, { content }).subscribe({
      next: (note) => {
        this.notes.update((current) => [note, ...current]);
        this.newNote.set('');
        this.isSavingNote.set(false);
      },
      error: () => this.isSavingNote.set(false),
    });
  }
}
