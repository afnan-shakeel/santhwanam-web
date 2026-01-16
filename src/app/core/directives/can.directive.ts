import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  OnDestroy,
  EmbeddedViewRef
} from '@angular/core';

import { AccessService } from '../services/access.service';
import { AccessStore } from '../state/access.store';
import { AccessMode, AccessLogic } from '../../shared/models/auth.types';

/**
 * Context passed to the template when using disable mode
 */
export interface CanDirectiveContext {
  /** Whether the user has the required permission(s) */
  $implicit: boolean;
  /** Whether the element should be disabled (inverse of $implicit) */
  disabled: boolean;
}

/**
 * Structural directive for permission-based UI control
 *
 * Modes:
 * - 'hide' (default): Element is not rendered if user lacks permission
 * - 'disable': Element is rendered, context variable indicates permission status
 *
 * Usage Examples:
 *
 * ```html
 * <!-- Hide mode (default) - element hidden if no permission -->
 * <button *appCan="'member.create'">Add Member</button>
 *
 * <!-- Multiple permissions with OR logic (default) -->
 * <button *appCan="['member.update', 'member.admin']">Edit</button>
 *
 * <!-- Multiple permissions with AND logic -->
 * <button *appCan="['member.view', 'wallet.view']; logic: 'and'">View All</button>
 *
 * <!-- Disable mode - element shown but can be disabled -->
 * <ng-container *appCan="'member.suspend'; mode: 'disable'; let canSuspend">
 *   <button [disabled]="!canSuspend" [title]="canSuspend ? '' : 'Permission required'">
 *     Suspend
 *   </button>
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[appCan]',
  standalone: true
})
export class CanDirective implements OnDestroy {
  private templateRef = inject(TemplateRef<CanDirectiveContext>);
  private viewContainer = inject(ViewContainerRef);
  private accessService = inject(AccessService);
  private accessStore = inject(AccessStore);

  private viewRef: EmbeddedViewRef<CanDirectiveContext> | null = null;
  private permission: string | string[] = '';
  private mode: AccessMode = 'hide';
  private logic: AccessLogic = 'or';

  @Input() set appCan(permission: string | string[]) {
    this.permission = permission;
    this.updateView();
  }

  @Input() set appCanMode(mode: AccessMode) {
    this.mode = mode;
    this.updateView();
  }

  @Input() set appCanLogic(logic: AccessLogic) {
    this.logic = logic;
    this.updateView();
  }

  constructor() {
    // React to permission changes (e.g., after re-login with different role)
    effect(() => {
      // Access the signal to subscribe to changes
      this.accessStore.permissions();
      this.updateView();
    });
  }

  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (this.mode === 'hide') {
      this.updateHideMode(hasPermission);
    } else {
      this.updateDisableMode(hasPermission);
    }
  }

  private updateHideMode(hasPermission: boolean): void {
    if (hasPermission) {
      if (!this.viewRef) {
        this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef, {
          $implicit: true,
          disabled: false
        });
      }
    } else {
      if (this.viewRef) {
        this.viewContainer.clear();
        this.viewRef = null;
      }
    }
  }

  private updateDisableMode(hasPermission: boolean): void {
    const context: CanDirectiveContext = {
      $implicit: hasPermission,
      disabled: !hasPermission
    };

    if (!this.viewRef) {
      this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef, context);
    } else {
      // Update existing view context
      this.viewRef.context.$implicit = hasPermission;
      this.viewRef.context.disabled = !hasPermission;
      this.viewRef.markForCheck();
    }
  }

  private checkPermission(): boolean {
    if (!this.permission || (Array.isArray(this.permission) && this.permission.length === 0)) {
      return true; // No permission required
    }
    return this.accessService.checkPermissions(this.permission, this.logic);
  }

  ngOnDestroy(): void {
    this.viewContainer.clear();
    this.viewRef = null;
  }
}
