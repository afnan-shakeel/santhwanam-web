import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly pendingCount = signal(0);

  readonly isLoading = computed(() => this.pendingCount() > 0);
  readonly pendingRequests = computed(() => this.pendingCount());

  start(): void {
    this.pendingCount.update((current) => current + 1);
  }

  stop(): void {
    this.pendingCount.update((current) => (current > 0 ? current - 1 : 0));
  }

  reset(): void {
    this.pendingCount.set(0);
  }
}

