import { Injectable, computed, signal, effect } from '@angular/core';

export interface UserInfo {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  userMetadata: any | null;
  createdAt: Date;
  lastSyncedAt: Date | null;
}

export interface AuthState {
  user: UserInfo | null;
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
  readonly user = computed(() => this.authState().user);
  readonly accessToken = computed(() => this.authState().accessToken);
  readonly refreshToken = computed(() => this.authState().refreshToken);
  readonly expiresAt = computed(() => this.authState().expiresAt);
  
  /**
   * Check if user is authenticated (has valid token and user)
   */
  readonly isAuthenticated = computed(() => {
    const state = this.authState();
    return !!state.accessToken && !!state.user && this.isTokenValid();
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
    // Auto-persist to localStorage whenever state changes
    effect(() => {
      const state = this.authState();
      this.saveToStorage(state);
    });
  }

  setAuth(user: UserInfo, accessToken: string, refreshToken?: string, expiresAt?: number): void {
    this.authState.set({
      user,
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt || null
    });
  }

  setUser(user: UserInfo | null): void {
    this.authState.update(state => ({ ...state, user }));
  }

  setAccessToken(token: string): void {
    this.authState.update(state => ({ ...state, accessToken: token }));
  }

  setRefreshToken(token: string): void {
    this.authState.update(state => ({ ...state, refreshToken: token }));
  }

  updateUser(updates: Partial<UserInfo>): void {
    this.authState.update(state => ({
      ...state,
      user: state.user ? { ...state.user, ...updates } : null
    }));
  }

  clearAuth(): void {
    this.authState.set({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    });
  }

  private loadFromStorage(): AuthState {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
    }
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    };
  }

  private saveToStorage(state: AuthState): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }
}
