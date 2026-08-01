import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PipelineStage, PipelineStageRequest } from '../models/pipeline-stage.model';

@Injectable({ providedIn: 'root' })
export class PipelineStageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/opportunity-stages`;

  list(): Observable<PipelineStage[]> {
    return this.http.get<PipelineStage[]>(this.baseUrl);
  }

  create(request: PipelineStageRequest): Observable<PipelineStage> {
    return this.http.post<PipelineStage>(this.baseUrl, request);
  }

  update(id: number, request: PipelineStageRequest): Observable<PipelineStage> {
    return this.http.put<PipelineStage>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
