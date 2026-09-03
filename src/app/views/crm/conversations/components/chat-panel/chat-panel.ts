import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getInitials } from '../../../../../shared/utils/initials.util';
import { Plantilla, PlantillaVariable } from '../../../templates/models/template.model';
import { TemplateService } from '../../../templates/services/template.service';
import { ConversationStatus, ConversationSummary, Message, MessageAttachment } from '../../models/conversation.model';
import { ConversationService } from '../../services/conversation.service';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const SEARCH_DEBOUNCE_MS = 350;

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔',
  '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '🤗',
  '🤔', '🤭', '🤫', '😶', '😐', '🙄', '😯', '😮', '😲', '😴',
  '🤤', '🥴', '🤢', '🤧', '😷', '🤒', '🤕', '🥱', '😈', '👍',
  '👎', '👏', '🙌', '🙏', '💪', '🤝', '👋', '✌️', '🤞', '🎉',
  '🔥', '💯', '❤️', '💔', '⭐', '✅', '❌', '📌', '🎁', '☕',
];

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
export class ChatPanel implements OnDestroy {
  private readonly conversationService = inject(ConversationService);
  private readonly templateService = inject(TemplateService);

  readonly conversation = input<ConversationSummary | null>(null);
  readonly messages = input.required<Message[]>();
  readonly hasMoreOlder = input(false);
  readonly isLoadingOlder = input(false);
  readonly isSending = input(false);

  readonly send = output<{ content: string; replyToMessageId: number | null }>();
  readonly sendAttachments = output<{ content: string; files: File[]; replyToMessageId: number | null }>();
  readonly sendTemplate = output<{ plantillaId: number; variables: Record<string, string>; replyToMessageId: number | null }>();
  readonly loadOlder = output<void>();
  readonly statusChange = output<{ conversation: ConversationSummary; status: ConversationStatus }>();
  readonly toggleProfile = output<void>();
  readonly archiveToggle = output<ConversationSummary>();
  readonly markUnread = output<ConversationSummary>();
  readonly blockToggle = output<ConversationSummary>();
  readonly exportChat = output<ConversationSummary>();

  protected readonly statusOptions = STATUS_OPTIONS;

  private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  protected readonly draft = signal('');
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly attachmentError = signal<string | null>(null);
  protected readonly getInitials = getInitials;
  protected readonly emojis = EMOJIS;

  protected readonly isEmojiPickerOpen = signal(false);
  protected readonly isAttachMenuOpen = signal(false);
  protected readonly isOptionsMenuOpen = signal(false);

  protected readonly isRecording = signal(false);
  protected readonly recordingSeconds = signal(0);
  protected readonly formattedRecordingTime = () => {
    const total = this.recordingSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  protected readonly replyingTo = signal<Message | null>(null);

  protected readonly isSearchOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<Message[]>([]);
  protected readonly isSearching = signal(false);
  protected readonly searchNotice = signal<string | null>(null);

  protected readonly isTemplatePickerOpen = signal(false);
  protected readonly templates = signal<Plantilla[]>([]);
  protected readonly selectedTemplate = signal<Plantilla | null>(null);
  protected readonly templateVariables = signal<Record<string, string>>({});
  protected readonly isLoadingTemplates = signal(false);

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;
  private recordingIntervalId: ReturnType<typeof setInterval> | null = null;
  private pendingSendAfterStop = false;

  private readonly previewUrls = new Map<File, string>();
  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;

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
        this.closeSearch();
        this.replyingTo.set(null);
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

  ngOnDestroy(): void {
    this.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.previewUrls.clear();
    if (this.searchDebounceId !== null) {
      clearTimeout(this.searchDebounceId);
    }
  }

  protected isOutbound(message: Message): boolean {
    return message.direction === 'OUTBOUND';
  }

  protected isOnline(conversation: ConversationSummary): boolean {
    return conversation.online === true;
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
    const url = this.previewUrls.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrls.delete(file);
    }
    this.selectedFiles.update((current) => current.filter((f) => f !== file));
  }

  protected isPreviewableImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  protected getPreviewUrl(file: File): string {
    let url = this.previewUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.previewUrls.set(file, url);
    }
    return url;
  }

  protected onSubmit(): void {
    const content = this.draft().trim();
    const files = this.selectedFiles();
    const replyToMessageId = this.replyingTo()?.id ?? null;

    if (!content && files.length === 0) {
      return;
    }

    if (files.length > 0) {
      this.sendAttachments.emit({ content, files, replyToMessageId });
      this.clearSelectedFiles();
    } else {
      this.send.emit({ content, replyToMessageId });
    }

    this.draft.set('');
    this.replyingTo.set(null);
  }

  protected toggleEmojiPicker(): void {
    this.isAttachMenuOpen.set(false);
    this.isEmojiPickerOpen.update((value) => !value);
  }

  protected insertEmoji(emoji: string): void {
    this.draft.update((value) => value + emoji);
  }

  protected toggleAttachMenu(): void {
    this.isEmojiPickerOpen.set(false);
    this.isAttachMenuOpen.update((value) => !value);
  }

  protected openMediaPicker(input: HTMLInputElement): void {
    this.isAttachMenuOpen.set(false);
    input.click();
  }

  protected openDocumentPicker(input: HTMLInputElement): void {
    this.isAttachMenuOpen.set(false);
    input.click();
  }

  protected async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordingStream = stream;
      this.recordedChunks = [];

      const recorder = new MediaRecorder(stream);
      this.mediaRecorder = recorder;

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => this.onRecordingStopped());

      recorder.start();
      this.isRecording.set(true);
      this.recordingSeconds.set(0);
      this.recordingIntervalId = setInterval(() => this.recordingSeconds.update((s) => s + 1), 1000);
    } catch {
      this.attachmentError.set('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
    }
  }

  protected cancelRecording(): void {
    this.stopRecordingInternal(false);
  }

  protected confirmRecording(): void {
    this.stopRecordingInternal(true);
  }

  private stopRecordingInternal(send: boolean): void {
    this.pendingSendAfterStop = send;
    this.mediaRecorder?.stop();
    this.recordingStream?.getTracks().forEach((track) => track.stop());

    if (this.recordingIntervalId !== null) {
      clearInterval(this.recordingIntervalId);
      this.recordingIntervalId = null;
    }

    this.isRecording.set(false);
  }

  private onRecordingStopped(): void {
    const shouldSend = this.pendingSendAfterStop;
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const chunks = this.recordedChunks;
    this.recordedChunks = [];
    this.mediaRecorder = null;
    this.recordingStream = null;

    if (!shouldSend || chunks.length === 0) {
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    const extension = mimeType.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([blob], `nota-voz-${Date.now()}.${extension}`, { type: mimeType });
    this.sendAttachments.emit({ content: '', files: [file], replyToMessageId: null });
  }

  protected startReply(message: Message): void {
    this.replyingTo.set(message);
  }

  protected cancelReply(): void {
    this.replyingTo.set(null);
  }

  protected replyPreviewText(message: Message): string {
    return message.content?.trim() ? message.content : 'Archivo adjunto';
  }

  protected toggleOptionsMenu(): void {
    this.isOptionsMenuOpen.update((value) => !value);
  }

  protected onArchiveClick(): void {
    const conversation = this.conversation();
    this.isOptionsMenuOpen.set(false);
    if (conversation) {
      this.archiveToggle.emit(conversation);
    }
  }

  protected onMarkUnreadClick(): void {
    const conversation = this.conversation();
    this.isOptionsMenuOpen.set(false);
    if (conversation) {
      this.markUnread.emit(conversation);
    }
  }

  protected onBlockClick(): void {
    const conversation = this.conversation();
    this.isOptionsMenuOpen.set(false);
    if (conversation) {
      this.blockToggle.emit(conversation);
    }
  }

  protected onExportClick(): void {
    const conversation = this.conversation();
    this.isOptionsMenuOpen.set(false);
    if (conversation) {
      this.exportChat.emit(conversation);
    }
  }

  protected toggleTemplatePicker(): void {
    if (this.isTemplatePickerOpen()) {
      this.isTemplatePickerOpen.set(false);
      this.selectedTemplate.set(null);
      this.templateVariables.set({});
    } else {
      this.loadTemplates();
      this.isTemplatePickerOpen.set(true);
    }
  }

  private loadTemplates(): void {
    this.isLoadingTemplates.set(true);
    this.templateService.listActivas(1).subscribe({
      next: (list) => {
        this.templates.set(list);
        this.isLoadingTemplates.set(false);
      },
      error: () => {
        this.isLoadingTemplates.set(false);
      },
    });
  }

  protected selectTemplate(template: Plantilla): void {
    this.selectedTemplate.set(template);
    const vars: Record<string, string> = {};
    this.templateVariables.set(vars);
  }

  protected setTemplateVariable(key: string, value: string): void {
    this.templateVariables.update((current) => ({ ...current, [key]: value }));
  }

  protected sendTemplateMessage(): void {
    const template = this.selectedTemplate();
    if (!template) {
      return;
    }
    const replyToMessageId = this.replyingTo()?.id ?? null;
    this.sendTemplate.emit({
      plantillaId: template.id,
      variables: this.templateVariables(),
      replyToMessageId,
    });
    this.isTemplatePickerOpen.set(false);
    this.selectedTemplate.set(null);
    this.templateVariables.set({});
    this.replyingTo.set(null);
  }

  protected cancelTemplatePicker(): void {
    this.isTemplatePickerOpen.set(false);
    this.selectedTemplate.set(null);
    this.templateVariables.set({});
  }

  protected getTemplateVars(): PlantillaVariable[] {
    const vars: PlantillaVariable[] = [
      { key: 'nombre_contacto', label: 'Nombre del contacto', entidad: 'CLIENTE', campo: 'nombre' },
      { key: 'email', label: 'Email', entidad: 'CLIENTE', campo: 'email' },
      { key: 'telefono', label: 'Teléfono', entidad: 'CLIENTE', campo: 'phone' },
      { key: 'empresa_cliente', label: 'Empresa', entidad: 'CLIENTE', campo: 'company.name' },
    ];
    return vars;
  }

  protected toggleSearch(): void {
    if (this.isSearchOpen()) {
      this.closeSearch();
    } else {
      this.isSearchOpen.set(true);
    }
  }

  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchNotice.set(null);
    if (this.searchDebounceId !== null) {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = null;
    }
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchNotice.set(null);

    if (this.searchDebounceId !== null) {
      clearTimeout(this.searchDebounceId);
    }

    const query = value.trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    this.searchDebounceId = setTimeout(() => this.runSearch(query), SEARCH_DEBOUNCE_MS);
  }

  private runSearch(query: string): void {
    const conversation = this.conversation();
    if (!conversation) {
      return;
    }

    this.isSearching.set(true);
    this.conversationService.searchMessages(conversation.id, query).subscribe({
      next: (page) => {
        this.isSearching.set(false);
        this.searchResults.set(page.content);
      },
      error: () => {
        this.isSearching.set(false);
        this.searchNotice.set('No se pudo buscar en la conversación.');
      },
    });
  }

  protected jumpToMessage(messageId: number): void {
    const element = document.getElementById('msg-' + messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-brand-400');
      setTimeout(() => element.classList.remove('ring-2', 'ring-brand-400'), 1500);
      this.closeSearch();
    } else {
      this.searchNotice.set('Ese mensaje es más antiguo — usa "Cargar mensajes anteriores" para verlo.');
    }
  }

  private clearSelectedFiles(): void {
    this.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.previewUrls.clear();
    this.selectedFiles.set([]);
  }

  private scrollToBottom(): void {
    const element = this.messagesContainer()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
