import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EvolutionConnectResponse, EvolutionStatusResponse } from '../models/channel.model';

@Injectable({ providedIn: 'root' })
export class EvolutionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/evolution`;

  connect(connectionId: number): Observable<EvolutionConnectResponse> {
    return this.http.post<EvolutionConnectResponse>(`${this.baseUrl}/connect/${connectionId}`, {});
  }

  getStatus(connectionId: number): Observable<EvolutionStatusResponse> {
    return this.http.get<EvolutionStatusResponse>(`${this.baseUrl}/status/${connectionId}`);
  }

  disconnect(connectionId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/disconnect/${connectionId}`, {});
  }

  deleteInstance(connectionId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/delete/${connectionId}`, {});
  }
}
