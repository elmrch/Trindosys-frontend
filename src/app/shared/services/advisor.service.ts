import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Advisor } from '../models/advisor.model';

@Injectable({ providedIn: 'root' })
export class AdvisorService {
  private readonly http = inject(HttpClient);

  list(): Observable<Advisor[]> {
    return this.http.get<Advisor[]>(`${environment.apiUrl}/security/users`);
  }
}
