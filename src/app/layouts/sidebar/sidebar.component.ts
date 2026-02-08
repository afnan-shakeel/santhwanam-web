import { Component, input, output, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { SidebarMenuItemComponent } from './sidebar-menu-item/sidebar-menu-item.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MenuService, MenuItem } from '../../core/services/menu.service';
import { SidebarService } from './sidebar.service';

/**
 * SidebarComponent - Main sidebar navigation container
 * 
 * Features:
 * - Collapsible on desktop (persisted to localStorage)
 * - Mobile overlay mode
 * - Renders menu items with role/permission filtering
 * - Tracks active route
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, SidebarMenuItemComponent, IconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy {
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
  
  private routerSubscription?: Subscription;

  // Menu items from service (already filtered by role/permissions)
  menuItems = this.menuService.items;
  
  // Current active route
  activeRoute = signal<string>('');

  // Dynamic sidebar classes
  sidebarClasses = computed(() => {
    const base = 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out h-full';
    
    // Width based on expanded state
    const widthClass = this.expanded() ? 'w-64' : 'w-20';
    
    // Mobile: fixed overlay positioning
    if (this.mobileOpen()) {
      return `${base} fixed inset-y-0 left-0 z-50 w-64`;
    }
    
    // Desktop positioning
    return `${base} ${widthClass} hidden lg:flex`;
  });

  ngOnInit(): void {
    // Set initial active route
    this.activeRoute.set(this.router.url);
    
    // Track route changes for active state
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activeRoute.set((event as NavigationEnd).urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
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
    this.router.navigate([route]).then(() => {
    }, error => {
      console.error('Navigation error:', error);
    });
    // Close mobile sidebar on navigation
    this.mobileClose.emit();
  }
}
