import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ActivityNotification } from '../models/activity-notification.model';

@Injectable({ providedIn: 'root' })
export class ActivityNotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/activity-notifications`;

  list(onlyUnread = false): Observable<ActivityNotification[]> {
    const params = new HttpParams().set('onlyUnread', onlyUnread);
    return this.http.get<ActivityNotification[]>(this.baseUrl, { params });
  }

  markRead(id: number): Observable<ActivityNotification> {
    return this.http.patch<ActivityNotification>(`${this.baseUrl}/${id}/read`, {});
  }
}
