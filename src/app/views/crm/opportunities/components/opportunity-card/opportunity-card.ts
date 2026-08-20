import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SweetAlertService } from '../../../../../core/services/sweet-alert.service';
import { InitialsAvatar } from '../../../../../shared/components/initials-avatar/initials-avatar';
import { Advisor } from '../../../../../shared/models/advisor.model';
import { ConversationService } from '../../../conversations/services/conversation.service';
import { Opportunity } from '../../models/opportunity.model';

const AGE_WARNING_DAYS = 4;
const AGE_DANGER_DAYS = 7;

@Component({
  selector: 'app-opportunity-card',
  imports: [CurrencyPipe, DatePipe, InitialsAvatar],
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
      return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
    }
    if (days >= AGE_WARNING_DAYS) {
      return 'bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-500';
    }
    return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
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
