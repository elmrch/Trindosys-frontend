import { CustomerSummary } from '../../../../shared/models/customer-summary.model';

export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED';

export interface ConversationSummary {
  id: number;
  customer: CustomerSummary;
  channelCode: string;
  status: string;
  advisorId: number | null;
  lastActivityAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  /** null = el canal no expone presencia real (WhatsApp/Instagram/Messenger); solo aplica a WEBCHAT. */
  online: boolean | null;
  archived: boolean;
}

export interface MessageAttachment {
  url: string;
  mimeType: string;
  fileName: string;
}

export interface MessageReplyPreview {
  id: number;
  direction: string;
  contentPreview: string | null;
}

export interface Message {
  id: number;
  conversationId: number;
  direction: string;
  type: string;
  content: string;
  attachments: MessageAttachment[];
  deliveryStatus: string;
  senderAdvisorId: number | null;
  createdAt: string;
  replyTo: MessageReplyPreview | null;
}

export interface SendMessageRequest {
  content: string;
  replyToMessageId?: number | null;
}

export interface SendTemplateMessageRequest {
  plantillaId: number;
  variables?: Record<string, string>;
  replyToMessageId?: number | null;
}

export interface AgentInboxEvent {
  type: string;
  conversation: ConversationSummary;
  message?: Message;
}

export interface AssignConversationRequest {
  advisorId: number | null;
}

export interface UpdateConversationStatusRequest {
  status: ConversationStatus;
}
