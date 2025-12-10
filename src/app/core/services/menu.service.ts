import { Injectable, signal, computed } from '@angular/core';

export interface MenuItem {
  label: string;
  route: string;
  icon?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItems = signal<MenuItem[]>([
    { label: 'Admin', route: '/admin', active: true },
    { label: 'Permissions', route: '/permissions', active: false },
    { label: 'Roles', route: '/roles', active: false },
    { label: 'Users', route: '/users', active: false },
    { label: 'Forums', route: '/forums', active: true },
    { label: 'Areas', route: '/areas', active: true },
    { label: 'Units', route: '/units', active: true },
    { label: 'Agents', route: '/agents', active: false },
    { label: 'Members', route: '/members', active: false },
    { label: 'Death Claims', route: '/claims', active: false },
    { label: 'Contributions', route: '/contributions', active: false },
    { label: 'Ledger', route: '/ledger', active: false }
  ]);

  readonly items = computed(() => this.menuItems());

  setMenuItems(items: MenuItem[]): void {
    this.menuItems.set(items);
  }

  addMenuItem(item: MenuItem): void {
    this.menuItems.update(items => [...items, item]);
  }

  removeMenuItem(route: string): void {
    this.menuItems.update(items => items.filter(item => item.route !== route));
  }

  setActiveMenuItem(route: string): void {
    this.menuItems.update(items =>
      items.map(item => ({
        ...item,
        active: item.route === route
      }))
    );
  }
}
