import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Company } from '../../companies/models/company.model';
import { Opportunity } from '../../opportunities/models/opportunity.model';
import { Page } from '../../../../shared/models/page.model';
import { Customer, CustomerRequest, UpdateCustomerTagsRequest } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/crm/customers`;
  private readonly companiesUrl = `${environment.apiUrl}/crm/companies`;

  list(page: number, size: number, sort?: string, status?: string): Observable<Page<Customer>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) {
      params = params.set('sort', sort);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Page<Customer>>(this.baseUrl, { params });
  }

  get(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  create(request: CustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, request);
  }

  update(id: number, request: CustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: number): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  updateTags(id: number, tags: string[]): Observable<Customer> {
    const request: UpdateCustomerTagsRequest = { tags };
    return this.http.patch<Customer>(`${this.baseUrl}/${id}/tags`, request);
  }

  getOpportunities(id: number): Observable<Opportunity[]> {
    return this.http.get<Opportunity[]>(`${this.baseUrl}/${id}/opportunities`);
  }

  listCompanies(): Observable<Page<Company>> {
    return this.http.get<Page<Company>>(this.companiesUrl, { params: new HttpParams().set('page', '0').set('size', '100') });
  }
}
