export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
}

export interface ConversationSummary {
  id: number;
  customer: CustomerSummary;
  channelCode: string;
  status: string;
  advisorId: number | null;
  lastActivityAt: string;
  lastMessagePreview: string;
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
  message: Message;
}
