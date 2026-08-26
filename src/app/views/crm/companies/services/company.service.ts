import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Page } from '../../../../shared/models/page.model';
import { Company, CompanyRequest } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/companies`;

  list(page: number, size: number, search?: string): Observable<Page<Company>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Page<Company>>(this.baseUrl, { params });
  }

  listAll(): Observable<Page<Company>> {
    return this.http.get<Page<Company>>(this.baseUrl, { params: new HttpParams().set('page', '0').set('size', '100') });
  }

  get(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/${id}`);
  }

  create(request: CompanyRequest): Observable<Company> {
    return this.http.post<Company>(this.baseUrl, request);
  }

  update(id: number, request: CompanyRequest): Observable<Company> {
    return this.http.put<Company>(`${this.baseUrl}/${id}`, request);
  }

  activate(id: number): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
