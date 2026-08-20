import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Page } from '../../../../shared/models/page.model';
import {
  AssignConversationRequest,
  ConversationStatus,
  ConversationSummary,
  Message,
  SendMessageRequest,
  UpdateConversationStatusRequest,
} from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/conversations`;

  list(
    status?: string,
    channelId?: number,
    advisorId?: number,
    includeArchived = false,
  ): Observable<ConversationSummary[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (channelId) {
      params = params.set('channelId', channelId);
    }
    if (advisorId) {
      params = params.set('advisorId', advisorId);
    }
    if (includeArchived) {
      params = params.set('includeArchived', 'true');
    }
    return this.http.get<ConversationSummary[]>(this.baseUrl, { params });
  }

  getMessages(conversationId: number, page = 0, size = 30): Observable<Page<Message>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<Message>>(`${this.baseUrl}/${conversationId}/messages`, { params });
  }

  searchMessages(conversationId: number, query: string): Observable<Page<Message>> {
    const params = new HttpParams().set('q', query).set('size', 20);
    return this.http.get<Page<Message>>(`${this.baseUrl}/${conversationId}/messages/search`, { params });
  }

  sendMessage(conversationId: number, request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/${conversationId}/messages`, request);
  }

  sendAttachments(
    conversationId: number,
    content: string,
    files: File[],
    replyToMessageId?: number | null,
  ): Observable<Message> {
    const formData = new FormData();
    formData.append('content', content);
    files.forEach((file) => formData.append('files', file));
    if (replyToMessageId) {
      formData.append('replyToMessageId', String(replyToMessageId));
    }
    return this.http.post<Message>(`${this.baseUrl}/${conversationId}/messages/attachments`, formData);
  }

  assign(conversationId: number, advisorId: number | null): Observable<ConversationSummary> {
    const request: AssignConversationRequest = { advisorId };
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/assign`, request);
  }

  /** Devuelve la conversación más reciente del cliente en ese canal, creándola si no existe. */
  open(customerId: number, channelCode: string): Observable<ConversationSummary> {
    const params = new HttpParams().set('customerId', customerId).set('channelCode', channelCode);
    return this.http.post<ConversationSummary>(`${this.baseUrl}/open`, null, { params });
  }

  markRead(conversationId: number): Observable<ConversationSummary> {
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/read`, {});
  }

  updateStatus(conversationId: number, status: ConversationStatus): Observable<ConversationSummary> {
    const request: UpdateConversationStatusRequest = { status };
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/status`, request);
  }

  setArchived(conversationId: number, archived: boolean): Observable<ConversationSummary> {
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/archive`, { archived });
  }

  markUnread(conversationId: number): Observable<ConversationSummary> {
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/unread`, {});
  }

  setBlocked(conversationId: number, blocked: boolean): Observable<ConversationSummary> {
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/block`, { blocked });
  }

  exportConversation(conversationId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${conversationId}/export`, { responseType: 'blob' });
  }
}
