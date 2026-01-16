/**
 * Access Management Module Exports
 *
 * Centralized exports for access control functionality
 */

// Types
export * from '../../shared/models/auth.types';

// Store
export { AccessStore } from '../state/access.store';

// Services
export { AccessService } from './access.service';
export { ACTION_PERMISSIONS, type ActionConfig, type EntityType, type EntityActionType } from './action-permissions.config';

// Directive
export { CanDirective, type CanDirectiveContext } from '../directives/can.directive';

// Guards
export { authGuard, permissionGuard } from '../guards/auth.guard';
export {
  resourceAccessGuard,
  memberAccessGuard,
  agentAccessGuard,
  walletAccessGuard,
  deathClaimAccessGuard,
  type ResourceType
} from '../guards/resource-access.guard';
