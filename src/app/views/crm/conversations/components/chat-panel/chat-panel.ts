import { DatePipe } from '@angular/common';
import { Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getInitials } from '../../../../../shared/utils/initials.util';
import { ConversationStatus, ConversationSummary, Message, MessageAttachment } from '../../models/conversation.model';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

const STATUS_OPTIONS: { label: string; value: ConversationStatus }[] = [
  { label: 'Abierta', value: 'OPEN' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Resuelta', value: 'CLOSED' },
];

@Component({
  selector: 'app-chat-panel',
  imports: [DatePipe, FormsModule],
  templateUrl: './chat-panel.html',
})
export class ChatPanel {
  readonly conversation = input<ConversationSummary | null>(null);
  readonly messages = input.required<Message[]>();
  readonly hasMoreOlder = input(false);
  readonly isLoadingOlder = input(false);
  readonly isSending = input(false);

  readonly send = output<string>();
  readonly sendAttachments = output<{ content: string; files: File[] }>();
  readonly loadOlder = output<void>();
  readonly statusChange = output<{ conversation: ConversationSummary; status: ConversationStatus }>();
  readonly toggleProfile = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;

  private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  protected readonly draft = signal('');
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly attachmentError = signal<string | null>(null);
  protected readonly getInitials = getInitials;

  private trackedConversationId: number | null = null;
  private lastMessageId: number | null = null;

  constructor() {
    // Auto-scroll al fondo cuando cambia de conversación o llega/se envía un
    // mensaje nuevo (al final de la lista) — pero no cuando se cargan mensajes
    // anteriores (prepend), ahí el último mensaje sigue siendo el mismo.
    effect(() => {
      const conversationId = this.conversation()?.id ?? null;
      const list = this.messages();
      const lastId = list.length ? list[list.length - 1].id : null;
      const isNewConversation = conversationId !== this.trackedConversationId;

      if (isNewConversation) {
        this.trackedConversationId = conversationId;
        this.lastMessageId = lastId;
        if (list.length) {
          queueMicrotask(() => this.scrollToBottom());
        }
        return;
      }

      if (lastId !== null && lastId !== this.lastMessageId) {
        this.lastMessageId = lastId;
        queueMicrotask(() => this.scrollToBottom());
      }
    });
  }

  protected isOutbound(message: Message): boolean {
    return message.direction === 'OUTBOUND';
  }

  protected onStatusChange(value: string): void {
    const conversation = this.conversation();
    if (!conversation) {
      return;
    }
    this.statusChange.emit({ conversation, status: value as ConversationStatus });
  }

  protected isImage(attachment: MessageAttachment): boolean {
    return attachment.mimeType.startsWith('image/');
  }

  protected isAudio(attachment: MessageAttachment): boolean {
    return attachment.mimeType.startsWith('audio/');
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files ? Array.from(input.files) : [];
    input.value = '';

    if (picked.length === 0) {
      return;
    }

    const tooLarge = picked.find((file) => file.size > MAX_FILE_SIZE);
    if (tooLarge) {
      this.attachmentError.set(`"${tooLarge.name}" supera el límite de 20MB por archivo.`);
      return;
    }

    const totalSize = [...this.selectedFiles(), ...picked].reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      this.attachmentError.set('El total de archivos supera el límite de 50MB.');
      return;
    }

    this.attachmentError.set(null);
    this.selectedFiles.update((current) => [...current, ...picked]);
  }

  protected removeFile(file: File): void {
    this.selectedFiles.update((current) => current.filter((f) => f !== file));
  }

  protected onSubmit(): void {
    const content = this.draft().trim();
    const files = this.selectedFiles();

    if (!content && files.length === 0) {
      return;
    }

    if (files.length > 0) {
      this.sendAttachments.emit({ content, files });
      this.selectedFiles.set([]);
    } else {
      this.send.emit(content);
    }

    this.draft.set('');
  }

  private scrollToBottom(): void {
    const element = this.messagesContainer()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
