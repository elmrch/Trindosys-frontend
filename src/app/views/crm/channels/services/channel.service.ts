import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Channel, ChannelConnection, ChannelConnectionRequest } from '../models/channel.model';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm`;

  getChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${this.baseUrl}/channels`);
  }

  getConnections(channelId: number): Observable<ChannelConnection[]> {
    return this.http.get<ChannelConnection[]>(`${this.baseUrl}/channels/${channelId}/connections`);
  }

  getConnection(id: number): Observable<ChannelConnection> {
    return this.http.get<ChannelConnection>(`${this.baseUrl}/connections/${id}`);
  }

  createConnection(request: ChannelConnectionRequest): Observable<ChannelConnection> {
    return this.http.post<ChannelConnection>(`${this.baseUrl}/connections`, request);
  }

  updateConnection(id: number, request: ChannelConnectionRequest): Observable<ChannelConnection> {
    return this.http.put<ChannelConnection>(`${this.baseUrl}/connections/${id}`, request);
  }

  deleteConnection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/connections/${id}`);
  }
}
