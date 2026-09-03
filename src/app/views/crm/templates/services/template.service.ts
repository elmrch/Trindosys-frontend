import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Plantilla, PlantillaRequest, PlantillaVariable } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/plantillas`;

  list(empresaId: number): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(this.baseUrl, { params: { empresaId, tipo: 'GENERAL' } });
  }

  listActivas(empresaId: number): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(`${this.baseUrl}/activas`, { params: { empresaId, tipo: 'GENERAL' } });
  }

  get(id: number): Observable<Plantilla> {
    return this.http.get<Plantilla>(`${this.baseUrl}/${id}`);
  }

  create(request: PlantillaRequest): Observable<Plantilla> {
    return this.http.post<Plantilla>(this.baseUrl, request);
  }

  update(id: number, request: PlantillaRequest): Observable<Plantilla> {
    return this.http.put<Plantilla>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getVariables(): Observable<PlantillaVariable[]> {
    return this.http.get<PlantillaVariable[]>(`${this.baseUrl}/variables-disponibles`);
  }
}
