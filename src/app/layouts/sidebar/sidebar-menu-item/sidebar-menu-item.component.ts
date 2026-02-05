import { Component, input, output, computed } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MenuItem } from '../../../core/services/menu.service';

/**
 * SidebarMenuItemComponent - Recursive component for rendering menu items
 * 
 * Features:
 * - Handles items with and without children
 * - Shows/hides based on sidebar expanded state
 * - Supports deep nesting
 * - Highlights active route
 */
@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './sidebar-menu-item.component.html',
})
export class SidebarMenuItemComponent {
  // Inputs
  item = input.required<MenuItem>();
  sidebarExpanded = input.required<boolean>();
  isOpen = input<boolean>(false);
  activeRoute = input.required<string>();
  depth = input<number>(0);

  // Outputs
  toggle = output<void>();
  navigateTo = output<string>();

  // Computed properties
  hasChildren = computed(() => {
    const children = this.item().children;
    return children && children.length > 0;
  });

  isActive = computed(() => {
    const route = this.item().route;
    const current = this.activeRoute();
    
    // For items with children, don't mark parent as active
    if (this.hasChildren()) {
      return false;
    }
    
    // Exact match or starts with (for nested routes)
    return current === route || 
           (route !== '/' && current.startsWith(route + '/')) ||
           (route !== '/' && current === route);
  });

  isChildActive = computed(() => {
    if (!this.hasChildren()) return false;
    const current = this.activeRoute();
    const children = this.item().children;
    
    if (!children) return false;
    
    return children.some(child => 
      current === child.route || 
      current.startsWith(child.route + '/') ||
      current.startsWith(child.route)
    );
  });

  itemClasses = computed(() => {
    const base = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer';
    const depthPadding = this.depth() > 0 ? '' : '';
    
    // Active state (leaf items only)
    if (this.isActive()) {
      return `${base} ${depthPadding} bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400`;
    }
    
    // Open or has active child
    if (this.isOpen() || this.isChildActive()) {
      return `${base} ${depthPadding} bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white`;
    }
    
    // Default state
    return `${base} ${depthPadding} text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white`;
  });

  iconClasses = computed(() => {
    if (this.isActive()) {
      return 'text-primary-600 dark:text-primary-400 shrink-0';
    }
    return 'text-gray-400 dark:text-gray-500 shrink-0';
  });

  onClick(): void {
    if (this.hasChildren()) {
      this.toggle.emit();
    } else {
      this.navigateTo.emit(this.item().route);
    }
  }
}

// Self-reference for recursive template - handled via imports in Angular 20
