import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const guestGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  console.log('[guestGuard] Checking guest access, isAuthenticated:', authStore.isAuthenticated(), 'for route:', state.url);

  if (!authStore.isAuthenticated()) {
    return true;
  }

  // Redirect to dashboard if already authenticated
  console.log('[guestGuard] Already authenticated, redirecting to dashboard');
  router.navigate(['/dashboard']);
  return false;
};
