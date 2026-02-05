import { Injectable, computed, signal, effect } from '@angular/core';


export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

const AUTH_STORAGE_KEY = 'santhwanam.auth';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly authState = signal<AuthState>(this.loadFromStorage());

  // Computed signals for easy access
  readonly accessToken = computed(() => this.authState().accessToken);
  readonly refreshToken = computed(() => this.authState().refreshToken);
  readonly expiresAt = computed(() => this.authState().expiresAt);
  
  /**
   * Check if user is authenticated (has valid token and user)
   */
  readonly isAuthenticated = computed(() => {
    const state = this.authState();
    return !!state.accessToken && this.isTokenValid();
  });

  /**
   * Check if the current token is valid (not expired)
   */
  isTokenValid(): boolean {
    const expiresAt = this.authState().expiresAt;
    if (!expiresAt) {
      // If no expiry set, check if token exists
      return !!this.authState().accessToken;
    }
    // Add a small buffer (30 seconds) to account for network latency
    return Date.now() < (expiresAt - 30000);
  }

  /**
   * Check if token exists (regardless of validity)
   */
  hasToken(): boolean {
    return !!this.authState().accessToken;
  }

  constructor() {
    // Auto-persist to sessionStorage whenever state changes
    effect(() => {
      const state = this.authState();
      this.saveToStorage(state);
    });
  }

  setAuth(accessToken: string, refreshToken?: string, expiresAt?: number): void {
    console.log('[AuthStore] setAuth called with token:', !!accessToken, 'expiresAt:', expiresAt);
    
    // Convert expiresAt from seconds to milliseconds if needed
    // (API returns Unix timestamp in seconds, but Date.now() uses milliseconds)
    let expiresAtMs: number | null = null;
    if (expiresAt) {
      // If expiresAt is less than a reasonable millisecond timestamp (year 2001), 
      // it's likely in seconds and needs conversion
      expiresAtMs = expiresAt < 1000000000000 ? expiresAt * 1000 : expiresAt;
    }
    
    this.authState.set({
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt: expiresAtMs
    });
    console.log('[AuthStore] After set, isTokenValid:', this.isTokenValid(), 'isAuthenticated:', this.isAuthenticated());
  }

  setAccessToken(token: string): void {
    this.authState.update(state => ({ ...state, accessToken: token }));
  }

  setRefreshToken(token: string): void {
    this.authState.update(state => ({ ...state, refreshToken: token }));
  }


  clearAuth(): void {
    this.authState.set({
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    });
  }

  private loadFromStorage(): AuthState {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
    }
    return {
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    };
  }

  private saveToStorage(state: AuthState): void {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }
}
