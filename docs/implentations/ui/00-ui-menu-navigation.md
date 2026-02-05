# Collapsible Sidebar Navigation - Implementation Guide

**Version:** 1.0  
**Last Updated:** February 2025  
**Status:** Ready for Implementation

---

## Overview

This document provides a complete implementation guide for the collapsible sidebar navigation pattern for the MutualAid cooperative system. The design replaces the existing top navigation with a more scalable sidebar that supports:

- Deep menu hierarchies (parent/child relationships)
- Role-based menu filtering
- Permission-based visibility
- Collapsible/expandable states
- Mobile responsiveness
- User avatar dropdown with sign out

---

## Visual Design

### Desktop - Expanded State (Default)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────┐ ┌──────────────────────────────────────────────────┐ │
│ │                     │ │                                                  │ │
│ │  [Logo] MutualAid   │ │  Page Title                        🔔  [Avatar▾]│ │
│ │                     │ │                                                  │ │
│ ├─────────────────────┤ ├──────────────────────────────────────────────────┤ │
│ │                     │ │                                                  │ │
│ │  ▾ Admin            │ │                                                  │ │
│ │    ├─ Permissions   │ │                                                  │ │
│ │    ├─ Roles         │ │              Main Content Area                   │ │
│ │    ├─ Users         │ │                                                  │ │
│ │    └─ Workflows     │ │                                                  │ │
│ │                     │ │                                                  │ │
│ │  ◉ My Approvals     │ │                                                  │ │
│ │                     │ │                                                  │ │
│ │  ▸ Organization     │ │                                                  │ │
│ │                     │ │                                                  │ │
│ │  ◉ Agents           │ │                                                  │ │
│ │  ◉ Members          │ │                                                  │ │
│ │  ◉ Death Claims     │ │                                                  │ │
│ │                     │ │                                                  │ │
│ │  ▾ Cash Management  │ │                                                  │ │
│ │    ├─ My Custody    │ │                                                  │ │
│ │    ├─ Pending       │ │                                                  │ │
│ │    └─ Transfer      │ │                                                  │ │
│ │                     │ │                                                  │ │
│ │ ─────────────────── │ │                                                  │ │
│ │  [◀ Collapse]       │ │                                                  │ │
│ └─────────────────────┘ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

Sidebar Width: 256px (w-64)
```

### Desktop - Collapsed State

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌─────┐ ┌────────────────────────────────────────────────────────────────┐   │
│ │     │ │                                                                │   │
│ │ [M] │ │  Page Title                                      🔔  [Avatar▾]│   │
│ │     │ │                                                                │   │
│ ├─────┤ ├────────────────────────────────────────────────────────────────┤   │
│ │     │ │                                                                │   │
│ │ ⚙️  │ │                                                                │   │
│ │     │ │                                                                │   │
│ │ ✓   │ │                                                                │   │
│ │     │ │                  Main Content Area                             │   │
│ │ 🏢  │ │                                                                │   │
│ │     │ │                                                                │   │
│ │ 👥  │ │                                                                │   │
│ │     │ │                                                                │   │
│ │ 💰  │ │                                                                │   │
│ │     │ │                                                                │   │
│ │ ─── │ │                                                                │   │
│ │ [▶] │ │                                                                │   │
│ └─────┘ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘

Sidebar Width: 80px (w-20)
Tooltip on hover shows menu label
```

### Mobile View

```
┌─────────────────────────────┐
│ [☰]  Page Title    🔔 [Av] │
├─────────────────────────────┤
│                             │
│                             │
│    Main Content Area        │
│                             │
│                             │
└─────────────────────────────┘

Sidebar: Hidden by default
Hamburger menu (☰) toggles sidebar overlay
```

### Avatar Dropdown Menu

```
┌─────────────────────────────┐
│  [Avatar]                   │
│  John Doe                   │
│  john.doe@email.com         │
├─────────────────────────────┤
│  👤 My Profile              │
│  ⚙️ Settings                │
├─────────────────────────────┤
│  🚪 Sign Out                │
└─────────────────────────────┘
```

---

## Architecture

### Component Structure

```
src/app/
├── core/
│   ├── layout/
│   │   ├── layout.component.ts              # Main layout wrapper
│   │   ├── layout.component.html
│   │   ├── sidebar/
│   │   │   ├── sidebar.component.ts         # Sidebar container
│   │   │   ├── sidebar.component.html
│   │   │   ├── sidebar-menu-item/
│   │   │   │   ├── sidebar-menu-item.component.ts
│   │   │   │   └── sidebar-menu-item.component.html
│   │   │   └── sidebar.service.ts           # Sidebar state management
│   │   ├── header/
│   │   │   ├── header.component.ts          # Top header bar
│   │   │   ├── header.component.html
│   │   │   └── user-menu/
│   │   │       ├── user-menu.component.ts   # Avatar dropdown
│   │   │       └── user-menu.component.html
│   │   └── layout.service.ts                # Layout state (mobile detection)
│   ├── menu/
│   │   ├── menu.config.ts                   # Menu configuration (existing)
│   │   └── menu.service.ts                  # Menu filtering logic
│   └── auth/
│       └── auth.service.ts                  # User context (existing)
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MENU_CONFIG   │────▶│   MenuService    │────▶│    Sidebar      │
│   (Static)      │     │   (Filtering)    │     │   Component     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   AuthService    │
                    │   (User Roles/   │
                    │    Permissions)  │
                    └──────────────────┘
```

---

## Component Specifications

### 1. LayoutComponent

**Selector:** `<app-layout>`

**Purpose:** Main application shell containing sidebar, header, and router outlet.

**Template:**

```html
<!-- src/app/core/layout/layout.component.html -->
<div class="flex h-screen bg-gray-50">
  <!-- Sidebar -->
  <app-sidebar 
    [expanded]="sidebarExpanded()"
    [mobileOpen]="mobileSidebarOpen()"
    (expandedChange)="onSidebarExpandedChange($event)"
    (mobileClose)="onMobileSidebarClose()" />
  
  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Header -->
    <app-header 
      [pageTitle]="pageTitle()"
      (menuToggle)="onMenuToggle()" />
    
    <!-- Page Content -->
    <main class="flex-1 overflow-auto">
      <div class="p-6">
        <router-outlet />
      </div>
    </main>
  </div>
</div>

<!-- Mobile Overlay -->
@if (mobileSidebarOpen()) {
  <div 
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    (click)="onMobileSidebarClose()">
  </div>
}
```

**Component:**

```typescript
// src/app/core/layout/layout.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { SidebarService } from './sidebar/sidebar.service';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private sidebarService = inject(SidebarService);
  private layoutService = inject(LayoutService);

  // Sidebar state
  sidebarExpanded = this.sidebarService.expanded;
  mobileSidebarOpen = this.sidebarService.mobileOpen;
  
  // Page title from route data
  pageTitle = this.layoutService.pageTitle;

  onSidebarExpandedChange(expanded: boolean): void {
    this.sidebarService.setExpanded(expanded);
  }

  onMobileSidebarClose(): void {
    this.sidebarService.closeMobile();
  }

  onMenuToggle(): void {
    this.sidebarService.toggleMobile();
  }
}
```

---

### 2. SidebarService

**Purpose:** Manages sidebar expansion state with localStorage persistence.

```typescript
// src/app/core/layout/sidebar/sidebar.service.ts
import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'sidebar_expanded';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Desktop expanded state (persisted)
  expanded = signal<boolean>(this.loadExpandedState());
  
  // Mobile open state (not persisted)
  mobileOpen = signal<boolean>(false);
  
  // Track open menu sections
  openMenus = signal<Set<string>>(new Set());

  constructor() {
    // Persist expanded state changes
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expanded()));
    });
  }

  private loadExpandedState(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : true;
  }

  setExpanded(expanded: boolean): void {
    this.expanded.set(expanded);
  }

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  toggleMenu(menuLabel: string): void {
    this.openMenus.update(set => {
      const newSet = new Set(set);
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel);
      } else {
        newSet.add(menuLabel);
      }
      return newSet;
    });
  }

  isMenuOpen(menuLabel: string): boolean {
    return this.openMenus().has(menuLabel);
  }
}
```

---

### 3. MenuService

**Purpose:** Filters menu configuration based on user roles and permissions.

```typescript
// src/app/core/menu/menu.service.ts
import { Injectable, inject, computed } from '@angular/core';
import { MENU_CONFIG, MenuItemConfig } from './menu.config';
import { AuthService } from '../auth/auth.service';

export interface ProcessedMenuItem extends MenuItemConfig {
  visible: boolean;
  children?: ProcessedMenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private authService = inject(AuthService);

  /**
   * Returns menu items filtered by current user's roles and permissions
   */
  visibleMenuItems = computed<ProcessedMenuItem[]>(() => {
    const userRoles = this.authService.userRoles();
    const userPermissions = this.authService.userPermissions();
    
    return this.processMenuItems(MENU_CONFIG, userRoles, userPermissions);
  });

  private processMenuItems(
    items: MenuItemConfig[], 
    userRoles: string[], 
    userPermissions: string[]
  ): ProcessedMenuItem[] {
    return items
      .map(item => this.processMenuItem(item, userRoles, userPermissions))
      .filter(item => item.visible);
  }

  private processMenuItem(
    item: MenuItemConfig, 
    userRoles: string[], 
    userPermissions: string[]
  ): ProcessedMenuItem {
    // Process children first
    const processedChildren = item.children 
      ? this.processMenuItems(item.children, userRoles, userPermissions)
      : undefined;

    // Check direct visibility
    const directlyVisible = this.checkVisibility(item, userRoles, userPermissions);
    
    // Parent is visible if it has direct access OR any visible children
    const hasVisibleChildren = processedChildren && processedChildren.length > 0;
    const visible = directlyVisible || hasVisibleChildren;

    return {
      ...item,
      visible,
      children: processedChildren
    };
  }

  private checkVisibility(
    item: MenuItemConfig, 
    userRoles: string[], 
    userPermissions: string[]
  ): boolean {
    // No restrictions = always visible
    if (!item.permissions && !item.roles) {
      return true;
    }

    // Check roles (OR logic)
    if (item.roles && item.roles.length > 0) {
      const hasRole = item.roles.some(role => userRoles.includes(role));
      if (hasRole) return true;
    }

    // Check permissions (OR logic)
    if (item.permissions && item.permissions.length > 0) {
      const hasPermission = item.permissions.some(perm => userPermissions.includes(perm));
      if (hasPermission) return true;
    }

    return false;
  }
}
```

---

### 4. SidebarComponent

**Selector:** `<app-sidebar>`

**Inputs/Outputs:**

| Input | Type | Description |
|-------|------|-------------|
| `expanded` | `boolean` | Desktop expanded state |
| `mobileOpen` | `boolean` | Mobile overlay open state |

| Output | Type | Description |
|--------|------|-------------|
| `expandedChange` | `EventEmitter<boolean>` | Emits when expanded state changes |
| `mobileClose` | `EventEmitter<void>` | Emits when mobile sidebar should close |

**Template:**

```html
<!-- src/app/core/layout/sidebar/sidebar.component.html -->
<aside 
  [class]="sidebarClasses()"
  [attr.aria-expanded]="expanded()">
  
  <!-- Logo Section -->
  <div class="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
    <a routerLink="/" class="flex items-center gap-3">
      <!-- Logo Icon -->
      <div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
        <span class="text-white font-bold text-lg">M</span>
      </div>
      <!-- Logo Text (hidden when collapsed) -->
      @if (expanded()) {
        <span class="font-semibold text-gray-900 tracking-tight whitespace-nowrap">
          MutualAid
        </span>
      }
    </a>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
    @for (item of menuItems(); track item.label) {
      <app-sidebar-menu-item
        [item]="item"
        [expanded]="expanded()"
        [isOpen]="isMenuOpen(item.label)"
        [activeRoute]="activeRoute()"
        (toggle)="onMenuToggle(item.label)"
        (navigate)="onNavigate($event)" />
    }
  </nav>

  <!-- Collapse Toggle (Desktop only) -->
  <div class="p-3 border-t border-gray-200 shrink-0 hidden lg:block">
    <button
      type="button"
      (click)="onCollapseToggle()"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      [attr.aria-label]="expanded() ? 'Collapse sidebar' : 'Expand sidebar'">
      
      <!-- Collapse/Expand Icon -->
      <svg 
        class="w-5 h-5 transition-transform"
        [class.rotate-180]="!expanded()"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      
      @if (expanded()) {
        <span class="text-sm">Collapse</span>
      }
    </button>
  </div>
</aside>
```

**Component:**

```typescript
// src/app/core/layout/sidebar/sidebar.component.ts
import { Component, input, output, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SidebarMenuItemComponent } from './sidebar-menu-item/sidebar-menu-item.component';
import { MenuService, ProcessedMenuItem } from '../../menu/menu.service';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, SidebarMenuItemComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  // Inputs
  expanded = input.required<boolean>();
  mobileOpen = input.required<boolean>();
  
  // Outputs
  expandedChange = output<boolean>();
  mobileClose = output<void>();

  // Services
  private menuService = inject(MenuService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  // Menu items
  menuItems = this.menuService.visibleMenuItems;
  
  // Current active route
  activeRoute = signal<string>(this.router.url);

  // Dynamic classes
  sidebarClasses = computed(() => {
    const base = 'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out';
    const widthClass = this.expanded() ? 'w-64' : 'w-20';
    
    // Mobile: fixed overlay positioning
    const mobileClasses = this.mobileOpen() 
      ? 'fixed inset-y-0 left-0 z-50 w-64' 
      : 'fixed -left-64 lg:static';
    
    return `${base} ${widthClass} ${mobileClasses} lg:relative lg:left-0`;
  });

  constructor() {
    // Track route changes for active state
    this.router.events.subscribe(() => {
      this.activeRoute.set(this.router.url);
    });
  }

  isMenuOpen(label: string): boolean {
    return this.sidebarService.isMenuOpen(label);
  }

  onMenuToggle(label: string): void {
    if (this.expanded()) {
      this.sidebarService.toggleMenu(label);
    }
  }

  onCollapseToggle(): void {
    this.expandedChange.emit(!this.expanded());
  }

  onNavigate(route: string): void {
    this.router.navigate([route]);
    // Close mobile sidebar on navigation
    this.mobileClose.emit();
  }
}
```

---

### 5. SidebarMenuItemComponent

**Selector:** `<app-sidebar-menu-item>`

**Purpose:** Recursive component for rendering menu items with children.

**Inputs/Outputs:**

| Input | Type | Description |
|-------|------|-------------|
| `item` | `ProcessedMenuItem` | Menu item data |
| `expanded` | `boolean` | Sidebar expanded state |
| `isOpen` | `boolean` | Whether submenu is open |
| `activeRoute` | `string` | Current active route |
| `depth` | `number` | Nesting depth (default: 0) |

| Output | Type | Description |
|--------|------|-------------|
| `toggle` | `EventEmitter<void>` | Emits when parent item clicked |
| `navigate` | `EventEmitter<string>` | Emits route to navigate to |

**Template:**

```html
<!-- src/app/core/layout/sidebar/sidebar-menu-item/sidebar-menu-item.component.html -->
<div class="mb-1">
  <!-- Menu Item Button -->
  <button
    type="button"
    (click)="onClick()"
    [class]="itemClasses()"
    [attr.aria-expanded]="hasChildren() ? isOpen() : null"
    [attr.aria-current]="isActive() ? 'page' : null"
    [title]="!expanded() ? item().label : null">
    
    <!-- Icon -->
    <span class="material-symbols-outlined text-xl shrink-0" [class]="iconClasses()">
      {{ item().icon || 'circle' }}
    </span>
    
    <!-- Label (hidden when collapsed) -->
    @if (expanded()) {
      <span class="flex-1 text-left text-sm font-medium truncate">
        {{ item().label }}
      </span>
      
      <!-- Chevron for items with children -->
      @if (hasChildren()) {
        <svg 
          class="w-4 h-4 transition-transform duration-200"
          [class.rotate-180]="isOpen()"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      }
    }
  </button>

  <!-- Children (Submenu) -->
  @if (hasChildren() && expanded() && isOpen()) {
    <div 
      class="mt-1 ml-4 pl-4 border-l border-gray-200"
      role="menu"
      [attr.aria-label]="item().label + ' submenu'">
      @for (child of item().children; track child.label) {
        <app-sidebar-menu-item
          [item]="child"
          [expanded]="expanded()"
          [isOpen]="false"
          [activeRoute]="activeRoute()"
          [depth]="depth() + 1"
          (navigate)="navigate.emit($event)" />
      }
    </div>
  }
</div>
```

**Component:**

```typescript
// src/app/core/layout/sidebar/sidebar-menu-item/sidebar-menu-item.component.ts
import { Component, input, output, computed } from '@angular/core';
import { ProcessedMenuItem } from '../../../menu/menu.service';

@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [],
  templateUrl: './sidebar-menu-item.component.html',
})
export class SidebarMenuItemComponent {
  // Inputs
  item = input.required<ProcessedMenuItem>();
  expanded = input.required<boolean>();
  isOpen = input<boolean>(false);
  activeRoute = input.required<string>();
  depth = input<number>(0);

  // Outputs
  toggle = output<void>();
  navigate = output<string>();

  // Computed properties
  hasChildren = computed(() => {
    return this.item().children && this.item().children.length > 0;
  });

  isActive = computed(() => {
    const route = this.item().route;
    const current = this.activeRoute();
    
    // Exact match or starts with (for nested routes)
    return current === route || 
           (route !== '/' && current.startsWith(route));
  });

  isChildActive = computed(() => {
    if (!this.hasChildren()) return false;
    const current = this.activeRoute();
    return this.item().children!.some(child => 
      current === child.route || current.startsWith(child.route)
    );
  });

  itemClasses = computed(() => {
    const base = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors';
    const paddingLeft = `pl-${3 + this.depth() * 4}`;
    
    if (this.isActive() && !this.hasChildren()) {
      return `${base} ${paddingLeft} bg-primary-50 text-primary-700`;
    }
    
    if (this.isOpen() || this.isChildActive()) {
      return `${base} ${paddingLeft} bg-gray-50 text-gray-900`;
    }
    
    return `${base} ${paddingLeft} text-gray-600 hover:bg-gray-50 hover:text-gray-900`;
  });

  iconClasses = computed(() => {
    if (this.isActive() && !this.hasChildren()) {
      return 'text-primary-600';
    }
    return 'text-gray-400 group-hover:text-gray-600';
  });

  onClick(): void {
    if (this.hasChildren()) {
      this.toggle.emit();
    } else {
      this.navigate.emit(this.item().route);
    }
  }
}

// Self-reference for recursive template
SidebarMenuItemComponent.prototype.constructor['ɵcmp'].directiveDefs = () => [SidebarMenuItemComponent];
```

---

### 6. HeaderComponent

**Selector:** `<app-header>`

**Template:**

```html
<!-- src/app/core/layout/header/header.component.html -->
<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
  <!-- Left Section -->
  <div class="flex items-center gap-4">
    <!-- Mobile Menu Toggle -->
    <button
      type="button"
      (click)="menuToggle.emit()"
      class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
      aria-label="Toggle menu">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    
    <!-- Page Title -->
    <h1 class="text-lg font-semibold text-gray-900">
      {{ pageTitle() }}
    </h1>
  </div>

  <!-- Right Section -->
  <div class="flex items-center gap-3">
    <!-- Notifications -->
    <button
      type="button"
      class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      aria-label="Notifications">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <!-- Notification Badge -->
      @if (notificationCount() > 0) {
        <span class="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
      }
    </button>

    <!-- User Menu -->
    <app-user-menu />
  </div>
</header>
```

**Component:**

```typescript
// src/app/core/layout/header/header.component.ts
import { Component, input, output, signal } from '@angular/core';
import { UserMenuComponent } from './user-menu/user-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [UserMenuComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  pageTitle = input<string>('Dashboard');
  menuToggle = output<void>();
  
  // TODO: Connect to notification service
  notificationCount = signal<number>(3);
}
```

---

### 7. UserMenuComponent

**Selector:** `<app-user-menu>`

**Template:**

```html
<!-- src/app/core/layout/header/user-menu/user-menu.component.html -->
<div class="relative" #menuContainer>
  <!-- Trigger Button -->
  <button
    type="button"
    (click)="toggleMenu()"
    class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
    [attr.aria-expanded]="isOpen()"
    aria-haspopup="true">
    
    <!-- Avatar -->
    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
      @if (user()?.photoUrl) {
        <img [src]="user()?.photoUrl" [alt]="user()?.fullName" class="w-full h-full rounded-full object-cover" />
      } @else {
        <span class="text-sm font-medium text-primary-700">
          {{ userInitials() }}
        </span>
      }
    </div>
    
    <!-- Chevron -->
    <svg 
      class="w-4 h-4 text-gray-500 transition-transform"
      [class.rotate-180]="isOpen()"
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Dropdown Menu -->
  @if (isOpen()) {
    <div 
      class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
      role="menu"
      aria-orientation="vertical">
      
      <!-- User Info -->
      <div class="px-4 py-3 border-b border-gray-100">
        <p class="text-sm font-medium text-gray-900 truncate">{{ user()?.fullName }}</p>
        <p class="text-xs text-gray-500 truncate">{{ user()?.email }}</p>
      </div>
      
      <!-- Menu Items -->
      <div class="py-1">
        <a 
          routerLink="/my-profile"
          (click)="closeMenu()"
          class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem">
          <span class="material-symbols-outlined text-lg text-gray-400">person</span>
          My Profile
        </a>
        
        <a 
          routerLink="/settings"
          (click)="closeMenu()"
          class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem">
          <span class="material-symbols-outlined text-lg text-gray-400">settings</span>
          Settings
        </a>
      </div>
      
      <!-- Sign Out -->
      <div class="border-t border-gray-100 py-1">
        <button
          type="button"
          (click)="signOut()"
          class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem">
          <span class="material-symbols-outlined text-lg text-gray-400">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  }
</div>
```

**Component:**

```typescript
// src/app/core/layout/header/user-menu/user-menu.component.ts
import { Component, inject, signal, computed, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-menu.component.html',
})
export class UserMenuComponent {
  @ViewChild('menuContainer') menuContainer!: ElementRef;
  
  private authService = inject(AuthService);
  private router = inject(Router);

  isOpen = signal<boolean>(false);
  user = this.authService.currentUser;

  userInitials = computed(() => {
    const user = this.user();
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  });

  toggleMenu(): void {
    this.isOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  async signOut(): Promise<void> {
    this.closeMenu();
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  // Close on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.menuContainer.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  // Close on Escape
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenu();
  }
}
```

---

## Tailwind Configuration

### Required Tailwind Extensions

Add to your `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Use your existing primary color palette
        // This assumes you have primary-50 through primary-900 defined
      },
      transitionProperty: {
        'width': 'width',
      }
    },
  },
  plugins: [],
}
```

### Required CSS (Global)

Add to `styles.css`:

```css
/* src/styles.css */

/* Material Symbols Font (for icons) */
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

/* Smooth sidebar transitions */
.sidebar-transition {
  transition-property: width, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Scrollbar styling for sidebar */
.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 2px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.400');
}
```

---

## Route Configuration

Update your main `app.routes.ts` to use the layout:

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Public routes (no layout)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  
  // Protected routes (with layout)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes')
          .then(m => m.ADMIN_ROUTES)
      },
      {
        path: 'members',
        loadChildren: () => import('./features/members/members.routes')
          .then(m => m.MEMBER_ROUTES)
      },
      // ... other routes
    ]
  },
  
  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
```

---

## LayoutService (Page Title from Route)

```typescript
// src/app/core/layout/layout.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private pageTitle$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => {
      let route = this.activatedRoute;
      while (route.firstChild) {
        route = route.firstChild;
      }
      return route.snapshot.data['title'] || 'Dashboard';
    })
  );

  pageTitle = toSignal(this.pageTitle$, { initialValue: 'Dashboard' });

  // Mobile detection
  isMobile = signal<boolean>(window.innerWidth < 1024);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 1024);
    });
  }
}
```

---

## Implementation Checklist

### Phase 1: Core Components
- [ ] Create `SidebarService` with state management
- [ ] Create `MenuService` with filtering logic
- [ ] Create `LayoutService` for page title
- [ ] Create `LayoutComponent` shell
- [ ] Create `SidebarComponent`
- [ ] Create `SidebarMenuItemComponent` (recursive)
- [ ] Create `HeaderComponent`
- [ ] Create `UserMenuComponent`

### Phase 2: Styling & Polish
- [ ] Add Tailwind CSS classes
- [ ] Import Material Symbols font
- [ ] Add scrollbar styling
- [ ] Test responsive breakpoints
- [ ] Add transition animations

### Phase 3: Integration
- [ ] Update `app.routes.ts` with layout wrapper
- [ ] Connect `AuthService` for user data
- [ ] Connect `AuthService` for roles/permissions
- [ ] Test menu filtering by role
- [ ] Test permission-based visibility

### Phase 4: Testing & Refinement
- [ ] Test mobile hamburger menu
- [ ] Test sidebar collapse/expand persistence
- [ ] Test keyboard navigation (Escape to close)
- [ ] Test accessibility (ARIA attributes)
- [ ] Cross-browser testing

---

## File Summary

| File | Lines (Est.) | Priority |
|------|--------------|----------|
| `sidebar.service.ts` | ~50 | High |
| `menu.service.ts` | ~80 | High |
| `layout.service.ts` | ~35 | High |
| `layout.component.ts/html` | ~60 | High |
| `sidebar.component.ts/html` | ~120 | High |
| `sidebar-menu-item.component.ts/html` | ~130 | High |
| `header.component.ts/html` | ~70 | Medium |
| `user-menu.component.ts/html` | ~110 | Medium |
| `styles.css` (additions) | ~30 | Medium |
| `app.routes.ts` (updates) | ~20 | Low |

**Total New Code:** ~700 lines

---

## Notes

1. **Icons:** This implementation uses Material Symbols. If you prefer a different icon library (Heroicons, Lucide, etc.), update the icon references in templates.

2. **Primary Color:** All `primary-*` color classes assume your Tailwind config already has the primary color palette defined. Adjust class names if your project uses different color naming.

3. **AuthService Integration:** The code assumes your existing `AuthService` provides:
   - `currentUser` signal with user profile
   - `userRoles()` returning string array of role codes
   - `userPermissions()` returning string array of permission codes
   - `signOut()` method

4. **Tooltip on Collapsed State:** When sidebar is collapsed, hovering over icons should show tooltips. This is handled via the native `title` attribute. For richer tooltips, consider adding a tooltip directive.