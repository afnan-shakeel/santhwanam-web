// src/app/core/menu/menu.service.ts
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { MENU_CONFIG, MenuItemConfig } from './menu.config';
import { AuthService } from './auth.service';
import { AccessService } from './access.service';
import { AccessStore } from './access.index';

export interface MenuItem extends MenuItemConfig {
  active?: boolean;
  children?: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private authService = inject(AuthService);
  private accessService = inject(AccessService);
  private accessStore = inject(AccessStore);

  // Internal state with visibility tracking
  private _menuItems = signal<MenuItem[]>([]);

  // Public: only returns visible items
  readonly items = computed(() => this._menuItems());

  constructor() {
    // Recompute menu when auth state changes
    effect(() => {
      // Create dependencies on auth signals
      const permissions = this.accessStore.permissions();
      const roles = this.accessStore.roles();
      
      // Recompute visible menu
      const visibleMenu = this.buildVisibleMenu(MENU_CONFIG);
      this._menuItems.set(visibleMenu);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VISIBILITY COMPUTATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build menu with only visible items based on user's permissions/roles
   */
  private buildVisibleMenu(config: MenuItemConfig[]): MenuItem[] {
    const result: MenuItem[] = [];

    for (const item of config) {
      const visibleItem = this.processMenuItem(item);
      if (visibleItem) {
        result.push(visibleItem);
      }
    }

    return result;
  }

  /**
   * Process a single menu item and its children
   * Returns null if item should be hidden
   */
  private processMenuItem(item: MenuItemConfig): MenuItem | null {
    // Process children first (if any)
    let visibleChildren: MenuItem[] | undefined;
    
    if (item.children?.length) {
      visibleChildren = [];
      for (const child of item.children) {
        const visibleChild = this.processMenuItem(child);
        if (visibleChild) {
          visibleChildren.push(visibleChild);
        }
      }
    }

    // Check direct access
    const hasDirectAccess = this.hasAccess(item);

    // For parent items: visible if has direct access OR has visible children
    const hasVisibleChildren = visibleChildren && visibleChildren.length > 0;
    
    if (!hasDirectAccess && !hasVisibleChildren) {
      return null; // Hide this item
    }

    // Build the visible menu item
    const menuItem: MenuItem = {
      label: item.label,
      route: item.route,
      icon: item.icon,
      active: false
    };

    if (visibleChildren?.length) {
      menuItem.children = visibleChildren;
    }

    return menuItem;
  }

  /**
   * Check if current user has access to a menu item
   */
  private hasAccess(item: MenuItemConfig): boolean {
    // No restrictions = always visible
    if (!item.permissions?.length && !item.roles?.length) {
      return true;
    }

    // Check permissions (OR logic)
    if (item.permissions?.length) {
      if (this.accessStore.hasAnyPermission(item.permissions)) {
        return true;
      }
    }

    // Check roles (OR logic)
    if (item.roles?.length) {
      for (const roleCode of item.roles) {
        if (this.accessStore.hasRole(roleCode)) {
          return true;
        }
      }
    }

    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set active menu item by route
   */
  setActiveMenuItem(route: string): void {
    this._menuItems.update(items => this.updateActiveState(items, route));
  }

  private updateActiveState(items: MenuItem[], activeRoute: string): MenuItem[] {
    return items.map(item => {
      const isDirectMatch = item.route === activeRoute;
      let children = item.children;
      let isChildActive = false;

      if (children) {
        children = this.updateActiveState(children, activeRoute);
        isChildActive = children.some(c => c.active);
      }

      return {
        ...item,
        active: isDirectMatch || isChildActive,
        children
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Flatten menu into a single-level array
   */
  flattenItems(): MenuItem[] {
    const result: MenuItem[] = [];
    
    const walk = (items: MenuItem[]) => {
      for (const item of items) {
        result.push(item);
        if (item.children) {
          walk(item.children);
        }
      }
    };
    
    walk(this._menuItems());
    return result;
  }

  /**
   * Check if a route is accessible to current user
   */
  isRouteAccessible(route: string): boolean {
    const find = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.route === route) return true;
        if (item.children && find(item.children)) return true;
      }
      return false;
    };
    return find(this._menuItems());
  }

  /**
   * Get first accessible route (useful for redirect after login)
   */
  getDefaultRoute(): string {
    const items = this._menuItems();
    
    if (items.length === 0) {
      return '/dashboard'; // Fallback
    }

    // Return first item's route (or first child's route if parent has children)
    const first = items[0];
    if (first.children?.length) {
      return first.children[0].route;
    }
    return first.route;
  }

  /**
   * Find menu item by route
   */
  findByRoute(route: string): MenuItem | null {
    const find = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.route === route) return item;
        if (item.children) {
          const found = find(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(this._menuItems());
  }
}