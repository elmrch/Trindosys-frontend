import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { InitialsAvatar } from '../../../../../shared/components/initials-avatar/initials-avatar';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { ConversationService } from '../../../conversations/services/conversation.service';
import { Opportunity } from '../../models/opportunity.model';

const AGE_WARNING_DAYS = 4;
const AGE_DANGER_DAYS = 7;

@Component({
  selector: 'app-opportunity-card',
  imports: [CurrencyPipe, InitialsAvatar, RouterLink],
  templateUrl: './opportunity-card.html',
})
export class OpportunityCard {
  private readonly conversationService = inject(ConversationService);
  private readonly router = inject(Router);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly opportunity = input.required<Opportunity>();
  readonly advisors = input<Advisor[]>([]);

  readonly open = output<Opportunity>();
  readonly dragStart = output<Opportunity>();
  readonly delete = output<Opportunity>();

  protected readonly isOpeningWhatsapp = signal(false);

  protected readonly advisorName = computed(() => {
    const id = this.opportunity().advisorId;
    if (!id) {
      return this.opportunity().advisorName ?? null;
    }
    const advisor = this.advisors().find((a) => a.id === id);
    return advisor ? advisor.fullName : (this.opportunity().advisorName ?? `Asesor #${id}`);
  });

  protected readonly daysInStage = computed(() => {
    const changedAt = this.opportunity().stageChangedAt;
    const diffMs = Date.now() - new Date(changedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 86_400_000));
  });

  protected readonly ageClass = computed(() => {
    const days = this.daysInStage();
    if (days >= AGE_DANGER_DAYS) {
      return 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400';
    }
    if (days >= AGE_WARNING_DAYS) {
      return 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
    }
    return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
  });

  protected readonly lastActivityRelative = computed(() => {
    const opp = this.opportunity();
    const dateStr = opp.lastActivityAt || opp.updatedAt || opp.stageChangedAt || opp.createdAt;
    if (!dateStr) {
      return 'Sin actividad';
    }

    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) {
      return 'hace un momento';
    }
    if (diffMins < 60) {
      return `hace ${diffMins} min`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
      return isToday ? 'hoy' : `hace ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return 'hace 1d';
    }
    return `hace ${diffDays}d`;
  });

  protected readonly hasScheduledActivity = computed(() => {
    const opp = this.opportunity();
    if (opp.hasPendingActivity !== undefined) {
      return opp.hasPendingActivity;
    }
    if (opp.nextActivityDate) {
      return new Date(opp.nextActivityDate).getTime() > Date.now();
    }
    return false;
  });

  protected readonly weightedValue = computed(() => {
    const value = this.opportunity().estimatedValue;
    const probability = this.opportunity().stage.probability;
    if (value === null || !probability) {
      return null;
    }
    return (value * probability) / 100;
  });

  protected readonly hasWhatsapp = computed(() => !!this.opportunity().customer.phone);

  protected readonly phoneHref = computed(() => {
    const phone = this.opportunity().customer.phone;
    return phone ? `tel:${phone}` : null;
  });

  protected onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', String(this.opportunity().id));
    event.dataTransfer!.effectAllowed = 'move';
    this.dragStart.emit(this.opportunity());
  }

  protected onCustomerClick(event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/crm/customers', this.opportunity().customer.id]);
  }

  protected onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(this.opportunity());
  }

  // Abre (o crea) el hilo de WhatsApp del cliente en el inbox unificado, en vez
  // de salir a wa.me — así la conversación queda trazada dentro del pipeline.
  protected openWhatsapp(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpeningWhatsapp()) {
      return;
    }

    this.isOpeningWhatsapp.set(true);
    this.conversationService.open(this.opportunity().customer.id, 'WHATSAPP').subscribe({
      next: (conversation) => {
        this.isOpeningWhatsapp.set(false);
        this.router.navigate(['/crm/conversations'], { queryParams: { conversationId: conversation.id } });
      },
      error: (error: HttpErrorResponse) => {
        this.isOpeningWhatsapp.set(false);
        this.sweetAlert.error(
          error.status === 400
            ? 'No se pudo abrir el chat: revisa que el cliente tenga teléfono y que haya una conexión de WhatsApp configurada.'
            : 'No se pudo abrir el chat de WhatsApp.',
        );
      },
    });
  }
}
