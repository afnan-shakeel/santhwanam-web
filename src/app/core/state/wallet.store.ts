import { Injectable, computed, signal } from '@angular/core';
import { WalletSummary } from '../../shared/models/wallet.model';

/**
 * Wallet Store - Manages wallet state shared between my-wallet parent and child components
 * Uses Angular signals for reactive state management
 */
@Injectable({
  providedIn: 'root'
})
export class WalletStore {
  // Private state
  private readonly _wallet = signal<WalletSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly wallet = this._wallet.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly currentBalance = computed(() => this._wallet()?.currentBalance ?? 0);
  readonly memberId = computed(() => this._wallet()?.memberId ?? null);
  readonly memberCode = computed(() => this._wallet()?.memberCode ?? '');
  readonly memberName = computed(() => this._wallet()?.memberName ?? '');
  readonly stats = computed(() => this._wallet()?.stats ?? null);
  readonly alerts = computed(() => this._wallet()?.alerts ?? null);
  readonly agent = computed(() => this._wallet()?.agent ?? null);
  readonly recentTransactions = computed(() => this._wallet()?.recentTransactions ?? []);

  readonly isLowBalance = computed(() => {
    const wallet = this._wallet();
    return wallet?.alerts?.isLowBalance ?? (wallet ? wallet.currentBalance < 200 : false);
  });

  readonly recommendedTopUp = computed(() => {
    return this._wallet()?.alerts?.recommendedTopUp ?? 500;
  });

  readonly pendingDepositsAmount = computed(() => {
    return this._wallet()?.stats?.pendingDeposits ?? 0;
  });

  readonly pendingDepositsCount = computed(() => {
    return this._wallet()?.pendingDepositsCount ?? 0;
  });

  // Alias for agent info to use in deposit modal
  readonly agentInfo = computed(() => this._wallet()?.agent ?? null);

  // Methods to update state
  setWallet(wallet: WalletSummary | null): void {
    this._wallet.set(wallet);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  updateBalance(newBalance: number): void {
    this._wallet.update(wallet => {
      if (!wallet) return null;
      return { ...wallet, currentBalance: newBalance };
    });
  }

  clearWallet(): void {
    this._wallet.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}
