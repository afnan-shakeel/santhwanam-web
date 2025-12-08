import { Injectable } from '@angular/core';

const TOKEN_KEY = 'santhwanam.auth.token';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}

