import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { AuthStore, UserInfo } from '../state/auth.store';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpService);
  private authStore = inject(AuthStore);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.user && response.accessToken) {
          this.authStore.setAuth(
            response.user,
            response.accessToken,
            response.refreshToken || undefined,
            response.expiresAt || undefined
          );
        }
      })
    );
  }

  register(data: RegisterData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/register', data).pipe(
      tap(response => {
        if (response.user && response.accessToken) {
          this.authStore.setAuth(
            response.user,
            response.accessToken,
            response.refreshToken || undefined,
            response.expiresAt || undefined
          );
        }
      })
    );
  }

  logout(): void {
    this.authStore.clearAuth();
    // Optionally call backend logout endpoint
    // this.http.post('/auth/logout', {}).subscribe();
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/auth/reset-password/request', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.authStore.refreshToken();
    return this.http.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        this.authStore.setAccessToken(response.accessToken);
      })
    );
  }

  getCurrentUser(): Observable<UserInfo> {
    return this.http.get<UserInfo>('/auth/me').pipe(
      tap(user => {
        this.authStore.setUser(user);
      })
    );
  }

  updateProfile(updates: Partial<UserInfo>): Observable<UserInfo> {
    return this.http.patch<UserInfo>('/auth/profile', updates).pipe(
      tap(user => {
        this.authStore.setUser(user);
      })
    );
  }
}
