import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CreateUserRequest, Role, UpdateUserRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/security/users`;

  listActive(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  listAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/all`);
  }

  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  update(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: number): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  activate(id: number): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/activate`, {});
  }

  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiUrl}/security/roles`);
  }
}
