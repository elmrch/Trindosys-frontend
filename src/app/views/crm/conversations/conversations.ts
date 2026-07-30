import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatPanel } from './components/chat-panel/chat-panel';
import { UnifiedInbox } from './components/unified-inbox/unified-inbox';
import { AgentInboxEvent, ConversationSummary, Message } from './models/conversation.model';
import { AgentInboxSocketService } from './services/agent-inbox-socket.service';
import { ConversationService } from './services/conversation.service';

@Component({
  selector: 'app-conversations',
  imports: [UnifiedInbox, ChatPanel],
  templateUrl: './conversations.html',
})
export class Conversations implements OnInit {
  private readonly conversationService = inject(ConversationService);
  private readonly socket = inject(AgentInboxSocketService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly conversations = signal<ConversationSummary[]>([]);
  protected readonly selectedConversation = signal<ConversationSummary | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoadingOlder = signal(false);
  protected readonly isSending = signal(false);
  protected readonly hasMoreOlder = signal(false);

  private currentPage = 0;

  ngOnInit(): void {
    this.loadConversations();

    this.socket.connect();
    this.socket.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => this.onInboxEvent(event));
    this.destroyRef.onDestroy(() => this.socket.disconnect());
  }

  protected loadConversations(): void {
    this.errorMessage.set(null);
    this.conversationService.list().subscribe({
      next: (list) => this.conversations.set(this.sortByActivity(list)),
      error: () => this.errorMessage.set('No se pudieron cargar las conversaciones.'),
    });
  }

  protected selectConversation(conversation: ConversationSummary): void {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.currentPage = 0;
    this.loadMessages(conversation.id, 0);
  }

  protected loadOlderMessages(): void {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return;
    }
    this.isLoadingOlder.set(true);
    this.loadMessages(conversation.id, this.currentPage + 1, true);
  }

  protected sendMessage(content: string): void {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return;
    }

    this.isSending.set(true);
    this.conversationService.sendMessage(conversation.id, { content }).subscribe({
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

  protected sendAttachments(payload: { content: string; files: File[] }): void {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return;
    }

    this.isSending.set(true);
    this.conversationService.sendAttachments(conversation.id, payload.content, payload.files).subscribe({
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
    if (event.type !== 'new_message') {
      return;
    }

    this.conversations.update((list) => {
      const exists = list.some((c) => c.id === event.conversation.id);
      const updated = exists
        ? list.map((c) => (c.id === event.conversation.id ? event.conversation : c))
        : [event.conversation, ...list];
      return this.sortByActivity(updated);
    });

    if (this.selectedConversation()?.id === event.conversation.id) {
      this.appendMessage(event.message);
    }
  }

  private appendMessage(message: Message): void {
    this.messages.update((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
  }

  private sortByActivity(list: ConversationSummary[]): ConversationSummary[] {
    return [...list].sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }
}
