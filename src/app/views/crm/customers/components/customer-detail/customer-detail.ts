import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { InitialsAvatar } from '../../../../../shared/components/initials-avatar/initials-avatar';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { AdvisorService } from '../../../../../shared/services/advisor.service';
import { ActivitiesTimeline } from '../../../activities/components/activities-timeline/activities-timeline';
import { ActivityForm } from '../../../activities/components/activity-form/activity-form';
import { ConversationService } from '../../../conversations/services/conversation.service';
import { OpportunityDetail } from '../../../opportunities/components/opportunity-detail/opportunity-detail';
import { Opportunity } from '../../../opportunities/models/opportunity.model';
import { PipelineStage } from '../../../opportunities/models/pipeline-stage.model';
import { OpportunityService } from '../../../opportunities/services/opportunity.service';
import { PipelineStageService } from '../../../opportunities/services/pipeline-stage.service';
import { CustomerForm } from '../customer-form/customer-form';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-detail',
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    ActivitiesTimeline,
    ActivityForm,
    InitialsAvatar,
    CustomerForm,
    OpportunityDetail,
  ],
  templateUrl: './customer-detail.html',
})
export class CustomerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly advisorService = inject(AdvisorService);
  private readonly opportunityService = inject(OpportunityService);
  private readonly pipelineStageService = inject(PipelineStageService);
  private readonly conversationService = inject(ConversationService);
  private readonly sweetAlert = inject(SweetAlertService);

  protected readonly customer = signal<Customer | null>(null);
  protected readonly opportunities = signal<Opportunity[]>([]);
  protected readonly stages = signal<PipelineStage[]>([]);
  protected readonly advisors = signal<Advisor[]>([]);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly refreshToken = signal(0);

  protected readonly activeCenterTab = signal<'activities' | 'new_activity'>('activities');
  protected readonly newTag = signal('');
  protected readonly isSavingTags = signal(false);

  protected readonly isOpeningWhatsapp = signal(false);
  protected readonly isEditingCustomer = signal(false);
  protected readonly isOpportunityModalOpen = signal(false);
  protected readonly editingOpportunity = signal<Opportunity | null>(null);
  protected readonly updatingOpportunityId = signal<number | null>(null);

  protected readonly collapsedSections = signal<Record<string, boolean>>({
    about: false,
    tags: false,
    notes: false,
    summary: false,
    deals: false,
    company: false,
    channels: false,
  });

  protected toggleSection(key: string): void {
    this.collapsedSections.update((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  protected isSectionOpen(key: string): boolean {
    return !this.collapsedSections()[key];
  }

  protected readonly advisorName = computed(() => {
    const c = this.customer();
    if (!c) return 'Sin asignar';
    if (c.advisorName) return c.advisorName;
    if (c.advisorId) {
      const adv = this.advisors().find((a) => a.id === c.advisorId);
      return adv ? adv.fullName : `Asesor #${c.advisorId}`;
    }
    return 'Sin asignar';
  });

  protected readonly totalOpportunityValue = computed(() => {
    return this.opportunities().reduce((sum, o) => sum + (o.estimatedValue ?? 0), 0);
  });

  protected readonly openOpportunities = computed(() => {
    return this.opportunities().filter((o) => o.stage.type === 'OPEN');
  });

  protected readonly wonOpportunities = computed(() => {
    return this.opportunities().filter((o) => o.stage.type === 'WON');
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.loadData(id);
  }

  protected loadData(customerId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.customerService.get(customerId).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar el contacto.');
      },
    });

    this.customerService.getOpportunities(customerId).subscribe({
      next: (opportunities) => this.opportunities.set(opportunities),
    });

    this.pipelineStageService.list().subscribe({
      next: (stages) => this.stages.set(stages),
    });

    this.advisorService.list().subscribe({
      next: (advisors) => this.advisors.set(advisors),
    });
  }

  protected copyToClipboard(text: string | null | undefined, label: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => this.sweetAlert.toast(`${label} copiado al portapapeles.`),
      () => this.sweetAlert.toast('No se pudo copiar.', 'error'),
    );
  }

  protected openWhatsapp(): void {
    const customer = this.customer();
    if (!customer) return;
    if (!customer.phone) {
      this.sweetAlert.error('El contacto no tiene número de teléfono registrado.');
      return;
    }

    this.isOpeningWhatsapp.set(true);
    this.conversationService.open(customer.id, 'WHATSAPP').subscribe({
      next: (conversation) => {
        this.isOpeningWhatsapp.set(false);
        this.router.navigate(['/crm/conversations'], { queryParams: { conversationId: conversation.id } });
      },
      error: (error: HttpErrorResponse) => {
        this.isOpeningWhatsapp.set(false);
        this.sweetAlert.error(
          error.status === 400
            ? 'No se pudo abrir el chat: verifica que haya una conexión de WhatsApp configurada.'
            : 'No se pudo abrir el chat de WhatsApp.',
        );
      },
    });
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
    if (!customer) return;
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
        this.sweetAlert.toast('Etiquetas actualizadas.');
      },
      error: () => {
        this.isSavingTags.set(false);
        this.sweetAlert.error('No se pudieron guardar las etiquetas.');
      },
    });
  }

  protected openCreateOpportunity(): void {
    this.editingOpportunity.set(null);
    this.isOpportunityModalOpen.set(true);
  }

  protected openEditOpportunity(opportunity: Opportunity): void {
    this.editingOpportunity.set(opportunity);
    this.isOpportunityModalOpen.set(true);
  }

  protected onOpportunitySaved(): void {
    this.isOpportunityModalOpen.set(false);
    this.editingOpportunity.set(null);
    const customer = this.customer();
    if (customer) {
      this.customerService.getOpportunities(customer.id).subscribe({
        next: (opportunities) => this.opportunities.set(opportunities),
      });
    }
  }

  protected openEditCustomer(): void {
    this.isEditingCustomer.set(true);
  }

  protected onCustomerSaved(): void {
    this.isEditingCustomer.set(false);
    const id = this.customer()?.id;
    if (id) {
      this.loadData(id);
    }
  }

  protected onActivityCreated(): void {
    this.refreshToken.update((value) => value + 1);
    this.activeCenterTab.set('activities');
  }

  protected statusBadgeClass(status: string | null | undefined): string {
    switch (status) {
      case 'LEAD':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30';
      case 'PROSPECT':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30';
      case 'CUSTOMER':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    }
  }
}
