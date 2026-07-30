import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, LoginRequest, LoginResponse } from './auth.model';

const TOKEN_KEY = 'trindosys-token';
const TOKEN_TYPE_KEY = 'trindosys-token-type';
const USER_KEY = 'trindosys-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<CurrentUser | null>(this.readStoredUser());

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.storeSession(response)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => this.clearSession()),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getTokenType(): string {
    return localStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private storeSession(response: LoginResponse): void {
    const user: CurrentUser = { email: response.email, fullName: response.fullName, role: response.role };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(TOKEN_TYPE_KEY, response.tokenType || 'Bearer');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  }
}
