import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

import { AuthStore } from '../state/auth.store';
import { AccessStore } from '../state/access.store';

/**
 * Guard that requires user to be authenticated
 * Redirects to login page if not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Guard that requires specific permission(s)
 * Use this to protect routes that require specific permissions
 *
 * @param permission - Single permission or array of permissions
 * @param logic - 'or' (default) = any permission, 'and' = all permissions required
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'members',
 *   canActivate: [permissionGuard('member.read')],
 *   ...
 * }
 *
 * {
 *   path: 'admin',
 *   canActivate: [permissionGuard(['admin.access', 'role.manage'])],
 *   ...
 * }
 *
 * {
 *   path: 'sensitive',
 *   canActivate: [permissionGuard(['admin.access', 'security.manage'], 'and')],
 *   ...
 * }
 * ```
 */
export function permissionGuard(
  permission: string | string[],
  logic: 'or' | 'and' = 'or'
): CanActivateFn {
  return (route, state) => {
    const authStore = inject(AuthStore);
    const accessStore = inject(AccessStore);
    const router = inject(Router);

    // First check authentication
    if (!authStore.isAuthenticated()) {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Then check permission
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = logic === 'and'
      ? accessStore.hasAllPermissions(permissions)
      : accessStore.hasAnyPermission(permissions);

    if (!hasPermission) {
      router.navigate(['/forbidden']);
      return false;
    }

    return true;
  };
}
