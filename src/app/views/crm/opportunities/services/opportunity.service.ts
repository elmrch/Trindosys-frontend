import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CloseOpportunityRequest,
  MoveOpportunityStageRequest,
  Opportunity,
  OpportunityRequest,
} from '../models/opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/opportunities`;

  list(stageId?: number, advisorId?: number): Observable<Opportunity[]> {
    let params = new HttpParams();
    if (stageId) {
      params = params.set('stageId', stageId);
    }
    if (advisorId) {
      params = params.set('advisorId', advisorId);
    }
    return this.http.get<Opportunity[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Opportunity> {
    return this.http.get<Opportunity>(`${this.baseUrl}/${id}`);
  }

  create(request: OpportunityRequest): Observable<Opportunity> {
    return this.http.post<Opportunity>(this.baseUrl, request);
  }

  update(id: number, request: OpportunityRequest): Observable<Opportunity> {
    return this.http.put<Opportunity>(`${this.baseUrl}/${id}`, request);
  }

  moveStage(id: number, stageId: number): Observable<Opportunity> {
    const request: MoveOpportunityStageRequest = { stageId };
    return this.http.patch<Opportunity>(`${this.baseUrl}/${id}/stage`, request);
  }

  close(id: number, stageId: number, lossReason: string | null): Observable<Opportunity> {
    const request: CloseOpportunityRequest = { stageId, lossReason };
    return this.http.patch<Opportunity>(`${this.baseUrl}/${id}/close`, request);
  }
}
