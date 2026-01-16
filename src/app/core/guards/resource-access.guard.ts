import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '../state/auth.store';
import { AuthService } from '../services/auth.service';

/**
 * Resource types that can be access-checked
 */
export type ResourceType = 'member' | 'agent' | 'wallet' | 'contribution' | 'deathClaim';

/**
 * Guard factory that checks if user has access to a specific resource
 *
 * This guard calls the backend `/auth/check-access` endpoint to verify
 * the user has permission to access the specific resource (ownership check).
 *
 * @param resourceType - The type of resource being accessed
 * @param idParam - The route parameter name containing the resource ID (default: 'id')
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'members/:memberId/profile',
 *   canActivate: [resourceAccessGuard('member', 'memberId')],
 *   ...
 * }
 * ```
 */
export function resourceAccessGuard(
  resourceType: ResourceType,
  idParam: string = 'id'
): CanActivateFn {
  return async (route: ActivatedRouteSnapshot) => {
    const authStore = inject(AuthStore);
    const authService = inject(AuthService);
    const router = inject(Router);

    // First check authentication
    if (!authStore.isAuthenticated()) {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: route.url.join('/') }
      });
      return false;
    }

    // Get resource ID from route params
    const resourceId = route.paramMap.get(idParam);
    if (!resourceId) {
      console.warn(`Resource access guard: No ${idParam} parameter found in route`);
      router.navigate(['/not-found']);
      return false;
    }

    try {
      // Call backend to check access
      const result = await firstValueFrom(
        authService.checkResourceAccess(resourceType, resourceId)
      );

      if (!result.allowed) {
        console.warn(`Access denied to ${resourceType}:${resourceId}`, result.reason);
        router.navigate(['/forbidden']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Resource access check failed:', error);
      router.navigate(['/forbidden']);
      return false;
    }
  };
}

/**
 * Pre-configured guard for member resource access
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'members/:memberId/profile',
 *   canActivate: [memberAccessGuard()],
 *   ...
 * }
 * ```
 */
export const memberAccessGuard = (idParam = 'memberId') =>
  resourceAccessGuard('member', idParam);

/**
 * Pre-configured guard for agent resource access
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'agents/:agentId/profile',
 *   canActivate: [agentAccessGuard()],
 *   ...
 * }
 * ```
 */
export const agentAccessGuard = (idParam = 'agentId') =>
  resourceAccessGuard('agent', idParam);

/**
 * Pre-configured guard for wallet resource access
 */
export const walletAccessGuard = (idParam = 'walletId') =>
  resourceAccessGuard('wallet', idParam);

/**
 * Pre-configured guard for death claim resource access
 */
export const deathClaimAccessGuard = (idParam = 'claimId') =>
  resourceAccessGuard('deathClaim', idParam);
