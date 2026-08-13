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
}

export interface MessageAttachment {
  url: string;
  mimeType: string;
  fileName: string;
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
}

export interface SendMessageRequest {
  content: string;
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
