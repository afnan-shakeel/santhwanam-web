import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../state/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  private authStore = inject(AuthStore);

  getToken(): string | null {
    return this.authStore.accessToken();
  }

  setToken(token: string): void {
    this.authStore.setAccessToken(token);
  }

  clearToken(): void {
    this.authStore.clearAuth();
  }
}

