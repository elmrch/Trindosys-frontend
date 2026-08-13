import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssignMenuItemsRequest, MenuItem, MenuItemRequest } from '../../shared/models/menu-item.model';

/**
 * Menú dinámico (`/api/security/menu*`). Vive en core porque el sidebar (core/layout)
 * consume `myMenu()`; las pantallas de administración de roles/módulos (en
 * views/security/users) reusan el mismo servicio para el catálogo y la asignación.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/security`;

  myMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/menu`);
  }

  catalog(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/menu-items`);
  }

  roleMenuItems(roleId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/roles/${roleId}/menu-items`);
  }

  assignMenuItems(roleId: number, menuItemIds: number[]): Observable<void> {
    const request: AssignMenuItemsRequest = { menuItemIds };
    return this.http.put<void>(`${this.baseUrl}/roles/${roleId}/menu-items`, request);
  }

  createMenuItem(request: MenuItemRequest): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.baseUrl}/menu-items`, request);
  }

  updateMenuItem(id: number, request: MenuItemRequest): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/menu-items/${id}`, request);
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/menu-items/${id}`);
  }
}
