import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { AuthStore } from '../state/auth.store';
import { AccessStore } from '../state/access.store';
import { AuthContext, AccessCheckResult } from '../../shared/models/auth.types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
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
  private accessStore = inject(AccessStore);

  private _isInitializing = false;
  private _isInitialized = false;

  /**
   * Initialize auth state on app startup
   * Call this from APP_INITIALIZER or root component
   */
  initializeAuth(): Observable<boolean> {
    if (this._isInitialized || this._isInitializing) {
      return of(this._isInitialized);
    }

    this._isInitializing = true;

    // Check if we have a valid token
    if (!this.authStore.hasToken() || !this.authStore.isTokenValid()) {
      this.clearAllAuth();
      this._isInitializing = false;
      this._isInitialized = true;
      return of(false);
    }

    // Fetch auth context from /auth/me
    return this.fetchAuthContext().pipe(
      tap(() => {
        this._isInitializing = false;
        this._isInitialized = true;
      }),
      switchMap(() => of(true)),
      catchError(() => {
        this.clearAllAuth();
        this._isInitializing = false;
        this._isInitialized = true;
        return of(false);
      })
    );
  }

  /**
   * Login with credentials, then fetch full auth context
   */
  login(credentials: LoginCredentials): Observable<AuthContext> {
    return this.http.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        console.log('[AuthService] Login response received:', !!response.accessToken);
        if (response.accessToken) {
          this.authStore.setAuth(
            response.accessToken,
            response.refreshToken || undefined,
            response.expiresAt || undefined
          );
          console.log('[AuthService] After setAuth, isAuthenticated:', this.authStore.isAuthenticated());
        }
      }),
      switchMap(response => {
        if (!response.accessToken) {
          return throwError(() => new Error('Login failed: No access token received'));
        }
        console.log('[AuthService] Fetching auth context...');
        // Fetch full auth context after login
        return this.fetchAuthContext();
      })
    );
  }

  register(data: RegisterData): Observable<AuthContext> {
    return this.http.post<LoginResponse>('/auth/register', data).pipe(
      tap(response => {
        if (response.accessToken) {
          this.authStore.setAuth(
            response.accessToken,
            response.refreshToken || undefined,
            response.expiresAt || undefined
          );
        }
      }),
      switchMap(response => {
        if (!response.accessToken) {
          return throwError(() => new Error('Registration failed: No access token received'));
        }
        return this.fetchAuthContext();
      })
    );
  }

  /**
   * Logout - clear all auth and access state
   */
  logout(): void {
    this.clearAllAuth();
    // Optionally call backend logout endpoint
    // this.http.post('/auth/logout', {}).subscribe();
  }

  /**
   * Fetch full auth context from /auth/me
   */
  fetchAuthContext(): Observable<AuthContext> {
    return this.http.get<AuthContext>('/auth/me').pipe(
      tap(context => {
        console.log('[AuthService] Auth context fetched:', context?.user?.email);
        this.accessStore.setContext(context);
        console.log('[AuthService] After setContext, isAuthenticated:', this.authStore.isAuthenticated());
      })
    );
  }

  /**
   * Check if current user can access a specific resource
   * Calls backend to verify ownership/access rights
   */
  checkResourceAccess(resource: string, resourceId: string): Observable<AccessCheckResult> {
    return this.http.get<AccessCheckResult>('/auth/check-access', {
      params: { resource, resourceId }
    }).pipe(
      catchError(() => of({ allowed: false, reason: 'Access check failed' }))
    );
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


  /**
   * Clear all authentication and access state
   */
  private clearAllAuth(): void {
    this.authStore.clearAuth();
    this.accessStore.clearContext();
  }
}
