import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AgentInboxSocketService } from '../../../core/services/agent-inbox-socket.service';
import { Advisor } from '../../../shared/models/advisor.model';
import { AdvisorService } from '../../../shared/services/advisor.service';
import { ChatPanel } from './components/chat-panel/chat-panel';
import { CustomerProfilePanel } from './components/customer-profile-panel/customer-profile-panel';
import { UnifiedInbox } from './components/unified-inbox/unified-inbox';
import { AgentInboxEvent, ConversationStatus, ConversationSummary, Message } from './models/conversation.model';
import { ConversationService } from './services/conversation.service';

const RELEVANT_EVENT_TYPES = [
  'new_message',
  'conversation_assigned',
  'conversation_read',
  'conversation_status',
  'conversation_archived',
  'conversation_unread',
  'conversation_blocked',
];

@Component({
  selector: 'app-conversations',
  imports: [UnifiedInbox, ChatPanel, CustomerProfilePanel],
  templateUrl: './conversations.html',
})
export class Conversations implements OnInit {
  private readonly conversationService = inject(ConversationService);
  private readonly advisorService = inject(AdvisorService);
  private readonly authService = inject(AuthService);
  private readonly socket = inject(AgentInboxSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly conversations = signal<ConversationSummary[]>([]);
  protected readonly selectedConversation = signal<ConversationSummary | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoadingOlder = signal(false);
  protected readonly isSending = signal(false);
  protected readonly hasMoreOlder = signal(false);

  protected readonly advisors = signal<Advisor[]>([]);
  // TODO: gatear a solo admin en cuanto se confirme el valor exacto del rol
  // (mismo caso pendiente que el filtro de SuperAdmin en Canales).
  protected readonly canAssign = signal(true);

  protected readonly statusFilter = signal<ConversationStatus | ''>('');
  protected readonly onlyMine = signal(false);
  protected readonly isProfilePanelOpen = signal(false);

  // El token/sesión no trae el id del usuario logueado, así que se resuelve
  // cruzando su email contra la lista de asesores (mismo id que devuelve
  // /api/security/users, que ya se carga acá para los selects de asignación).
  protected readonly currentAdvisorId = computed(() => {
    const email = this.authService.currentUser()?.email;
    if (!email) {
      return null;
    }
    return this.advisors().find((advisor) => advisor.email === email)?.id ?? null;
  });

  private currentPage = 0;

  ngOnInit(): void {
    this.loadConversations();
    this.loadAdvisors();

    // El socket ya está conectado a nivel de AppLayout (vive mientras haya
    // sesión); acá solo nos suscribimos a los eventos y marcamos como leído.
    this.socket.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onInboxEvent(event as AgentInboxEvent));
    this.socket.markAllRead();
  }

  protected loadConversations(): void {
    this.errorMessage.set(null);
    const status = this.statusFilter() || undefined;
    const advisorId = this.onlyMine() ? (this.currentAdvisorId() ?? undefined) : undefined;

    this.conversationService.list(status, undefined, advisorId).subscribe({
      next: (list) => {
        this.conversations.set(this.sortByActivity(list));
        this.selectFromQueryParam(list);
      },
      error: () => this.errorMessage.set('No se pudieron cargar las conversaciones.'),
    });
  }

  protected setStatusFilter(status: ConversationStatus | ''): void {
    this.statusFilter.set(status);
    this.loadConversations();
  }

  protected toggleOnlyMine(): void {
    this.onlyMine.update((value) => !value);
    this.loadConversations();
  }

  protected toggleProfilePanel(): void {
    this.isProfilePanelOpen.update((value) => !value);
  }

  // Permite llegar directo a una conversación puntual (ej. desde el ícono de
  // WhatsApp en Oportunidades) vía /crm/conversations?conversationId=123.
  private selectFromQueryParam(list: ConversationSummary[]): void {
    const rawId = this.route.snapshot.queryParamMap.get('conversationId');
    if (!rawId) {
      return;
    }
    const conversationId = Number(rawId);
    const conversation = list.find((c) => c.id === conversationId);
    if (conversation) {
      this.selectConversation(conversation);
    }
  }

  protected loadAdvisors(): void {
    this.advisorService.list().subscribe({
      next: (advisors) => this.advisors.set(advisors),
      error: () => {
        // No bloqueamos la bandeja si falla esto — simplemente no se podrá asignar.
      },
    });
  }

  protected selectConversation(conversation: ConversationSummary): void {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.currentPage = 0;
    this.loadMessages(conversation.id, 0);

    if (conversation.unreadCount > 0) {
      this.conversationService.markRead(conversation.id).subscribe({
        next: (updated) => this.applyConversationUpdate(updated),
        error: () => {
          // No es crítico: el badge se corrige solo en el próximo refresco de la lista.
        },
      });
    }
  }

  protected changeStatus(payload: { conversation: ConversationSummary; status: ConversationStatus }): void {
    this.conversationService.updateStatus(payload.conversation.id, payload.status).subscribe({
      next: (updated) => this.applyConversationUpdate(updated),
      error: () => this.errorMessage.set('No se pudo actualizar el estado de la conversación.'),
    });
  }

  protected loadOlderMessages(): void {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return;
    }
    this.isLoadingOlder.set(true);
    this.loadMessages(conversation.id, this.currentPage + 1, true);
  }

  protected sendMessage(payload: { content: string; replyToMessageId: number | null }): void {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return;
    }

    this.isSending.set(true);
    this.conversationService
      .sendMessage(conversation.id, { content: payload.content, replyToMessageId: payload.replyToMessageId })
      .subscribe({
        next: (message) => {
          this.isSending.set(false);
          this.appendMessage(message);
        },
        error: () => {
          this.isSending.set(false);
          this.errorMessage.set('No se pudo enviar el mensaje.');
        },
      });
  }

  protected sendAttachments(payload: { content: string; files: File[]; replyToMessageId: number | null }): void {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return;
    }

    this.isSending.set(true);
    this.conversationService
      .sendAttachments(conversation.id, payload.content, payload.files, payload.replyToMessageId)
      .subscribe({
        next: (message) => {
          this.isSending.set(false);
          this.appendMessage(message);
        },
        error: (error: HttpErrorResponse) => {
          this.isSending.set(false);
          this.errorMessage.set(
            error.status === 413 ? 'El archivo es demasiado grande.' : 'No se pudo enviar el adjunto.',
          );
        },
      });
  }

  protected toggleArchive(conversation: ConversationSummary): void {
    this.conversationService.setArchived(conversation.id, !conversation.archived).subscribe({
      next: (updated) => {
        this.applyConversationUpdate(updated);
        if (updated.archived && this.selectedConversation()?.id === updated.id) {
          this.selectedConversation.set(null);
          this.messages.set([]);
        }
      },
      error: () => this.errorMessage.set('No se pudo archivar la conversación.'),
    });
  }

  protected markConversationUnread(conversation: ConversationSummary): void {
    this.conversationService.markUnread(conversation.id).subscribe({
      next: (updated) => this.applyConversationUpdate(updated),
      error: () => this.errorMessage.set('No se pudo marcar como no leído.'),
    });
  }

  protected toggleBlock(conversation: ConversationSummary): void {
    this.conversationService.setBlocked(conversation.id, !conversation.customer.blocked).subscribe({
      next: (updated) => this.applyConversationUpdate(updated),
      error: () => this.errorMessage.set('No se pudo actualizar el bloqueo del cliente.'),
    });
  }

  protected exportConversation(conversation: ConversationSummary): void {
    this.conversationService.exportConversation(conversation.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `conversacion-${conversation.id}.txt`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.errorMessage.set('No se pudo exportar la conversación.'),
    });
  }

  protected assignAdvisor(payload: { conversation: ConversationSummary; advisorId: number | null }): void {
    this.conversationService.assign(payload.conversation.id, payload.advisorId).subscribe({
      next: (updated) => this.applyConversationUpdate(updated),
      error: () => this.errorMessage.set('No se pudo asignar la conversación.'),
    });
  }

  private loadMessages(conversationId: number, page: number, prepend = false): void {
    this.conversationService.getMessages(conversationId, page).subscribe({
      next: (result) => {
        this.currentPage = result.number;
        this.hasMoreOlder.set(!result.last);
        const ordered = [...result.content].reverse();
        this.messages.update((current) => (prepend ? [...ordered, ...current] : ordered));
        this.isLoadingOlder.set(false);
      },
      error: () => {
        this.isLoadingOlder.set(false);
        this.errorMessage.set('No se pudieron cargar los mensajes.');
      },
    });
  }

  private onInboxEvent(event: AgentInboxEvent): void {
    if (!RELEVANT_EVENT_TYPES.includes(event.type)) {
      return;
    }

    this.applyConversationUpdate(event.conversation);

    if (event.type === 'new_message') {
      // Ya estamos viendo la bandeja, así que no debe acumularse el badge.
      this.socket.markAllRead();

      if (this.selectedConversation()?.id === event.conversation.id && event.message) {
        this.appendMessage(event.message);
      }
    }
  }

  private applyConversationUpdate(conversation: ConversationSummary): void {
    this.conversations.update((list) => {
      const exists = list.some((c) => c.id === conversation.id);
      const updated = exists
        ? list.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...list];
      return this.sortByActivity(updated);
    });

    if (this.selectedConversation()?.id === conversation.id) {
      this.selectedConversation.set(conversation);
    }
  }

  private appendMessage(message: Message): void {
    this.messages.update((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
  }

  private sortByActivity(list: ConversationSummary[]): ConversationSummary[] {
    return [...list].sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }
}
