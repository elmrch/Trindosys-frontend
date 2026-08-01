import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Page } from '../../../../shared/models/page.model';
import { AssignConversationRequest, ConversationSummary, Message, SendMessageRequest } from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/conversations`;

  list(status?: string, channelId?: number): Observable<ConversationSummary[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (channelId) {
      params = params.set('channelId', channelId);
    }
    return this.http.get<ConversationSummary[]>(this.baseUrl, { params });
  }

  getMessages(conversationId: number, page = 0, size = 30): Observable<Page<Message>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<Message>>(`${this.baseUrl}/${conversationId}/messages`, { params });
  }

  sendMessage(conversationId: number, request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/${conversationId}/messages`, request);
  }

  sendAttachments(conversationId: number, content: string, files: File[]): Observable<Message> {
    const formData = new FormData();
    formData.append('content', content);
    files.forEach((file) => formData.append('files', file));
    return this.http.post<Message>(`${this.baseUrl}/${conversationId}/messages/attachments`, formData);
  }

  assign(conversationId: number, advisorId: number | null): Observable<ConversationSummary> {
    const request: AssignConversationRequest = { advisorId };
    return this.http.patch<ConversationSummary>(`${this.baseUrl}/${conversationId}/assign`, request);
  }
}
