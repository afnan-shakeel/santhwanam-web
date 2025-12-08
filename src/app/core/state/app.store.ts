import { Injectable, computed, signal } from '@angular/core';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppStore {
  private readonly appName = signal('Santhwanam Web');
  private readonly currentUser = signal<UserProfile | null>(null);
  private readonly featureFlags = signal<Record<string, boolean>>({});

  readonly title = computed(() => this.appName());
  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly flags = computed(() => this.featureFlags());

  setUser(user: UserProfile | null): void {
    this.currentUser.set(user);
  }

  setFeatureFlag(flag: string, enabled: boolean): void {
    this.featureFlags.update((existing) => ({ ...existing, [flag]: enabled }));
  }
}

