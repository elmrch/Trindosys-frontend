import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ActivityAuditLog } from '../models/activity-audit-log.model';
import {
  Activity,
  ActivityType,
  CreateCallRequest,
  CreateFollowUpRequest,
  CreateNoteRequest,
  CreateTaskRequest,
  TaskStatus,
  UpdateActivityRequest,
} from '../models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly customersUrl = `${environment.apiUrl}/crm/customers`;
  private readonly activitiesUrl = `${environment.apiUrl}/crm/activities`;

  list(type?: ActivityType, status?: TaskStatus): Observable<Activity[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Activity[]>(this.activitiesUrl, { params });
  }

  timeline(customerId: number, type?: ActivityType): Observable<Activity[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<Activity[]>(`${this.customersUrl}/${customerId}/activities`, { params });
  }

  createCall(customerId: number, request: CreateCallRequest): Observable<Activity> {
    return this.http.post<Activity>(`${this.customersUrl}/${customerId}/activities/calls`, request);
  }

  createTask(customerId: number, request: CreateTaskRequest): Observable<Activity> {
    return this.http.post<Activity>(`${this.customersUrl}/${customerId}/activities/tasks`, request);
  }

  createNote(customerId: number, request: CreateNoteRequest): Observable<Activity> {
    return this.http.post<Activity>(`${this.customersUrl}/${customerId}/activities/notes`, request);
  }

  createFollowUp(customerId: number, request: CreateFollowUpRequest): Observable<Activity> {
    return this.http.post<Activity>(`${this.customersUrl}/${customerId}/activities/follow-ups`, request);
  }

  get(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.activitiesUrl}/${id}`);
  }

  update(id: number, request: UpdateActivityRequest): Observable<Activity> {
    return this.http.put<Activity>(`${this.activitiesUrl}/${id}`, request);
  }

  complete(id: number): Observable<Activity> {
    return this.http.patch<Activity>(`${this.activitiesUrl}/${id}/complete`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.activitiesUrl}/${id}`);
  }

  auditLog(id: number): Observable<ActivityAuditLog[]> {
    return this.http.get<ActivityAuditLog[]>(`${this.activitiesUrl}/${id}/audit-log`);
  }
}
