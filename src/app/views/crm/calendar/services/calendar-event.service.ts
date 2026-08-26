import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Page } from '../../../../shared/models/page.model';
import { CalendarAuditEntry, CalendarEventRequest, CalendarEventResponse } from '../models/calendar-event.model';

@Injectable({ providedIn: 'root' })
export class CalendarEventService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/calendar-events`;

  list(params: { userId?: number; from?: string; to?: string; status?: string; page?: number; size?: number }): Observable<Page<CalendarEventResponse>> {
    let httpParams = new HttpParams();
    if (params.userId != null) httpParams = httpParams.set('userId', params.userId);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.size != null) httpParams = httpParams.set('size', params.size);
    return this.http.get<Page<CalendarEventResponse>>(this.baseUrl, { params: httpParams });
  }

  listByRange(from: string, to: string, userId?: number): Observable<Page<CalendarEventResponse>> {
    let params = new HttpParams().set('from', from).set('to', to).set('size', '500');
    if (userId != null) params = params.set('userId', userId);
    return this.http.get<Page<CalendarEventResponse>>(this.baseUrl, { params });
  }

  get(id: number): Observable<CalendarEventResponse> {
    return this.http.get<CalendarEventResponse>(`${this.baseUrl}/${id}`);
  }

  getByEntity(type: string, entityId: number): Observable<CalendarEventResponse[]> {
    return this.http.get<CalendarEventResponse[]>(`${this.baseUrl}/entity`, {
      params: new HttpParams().set('type', type).set('id', entityId),
    });
  }

  create(request: CalendarEventRequest): Observable<CalendarEventResponse> {
    return this.http.post<CalendarEventResponse>(this.baseUrl, request);
  }

  update(id: number, request: CalendarEventRequest): Observable<CalendarEventResponse> {
    return this.http.put<CalendarEventResponse>(`${this.baseUrl}/${id}`, request);
  }

  changeStatus(id: number, status: string): Observable<CalendarEventResponse> {
    return this.http.patch<CalendarEventResponse>(`${this.baseUrl}/${id}/status`, null, {
      params: new HttpParams().set('status', status),
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAudit(id: number): Observable<CalendarAuditEntry[]> {
    return this.http.get<CalendarAuditEntry[]>(`${this.baseUrl}/${id}/audit`);
  }
}
