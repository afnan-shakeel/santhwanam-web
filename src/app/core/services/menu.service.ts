import { Injectable, signal, computed } from '@angular/core';

export interface MenuItem {
  label: string;
  route: string;
  icon?: string;
  active?: boolean;
  // Optional children for nested menus (two levels supported)
  children?: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItems = signal<MenuItem[]>([
    {
      label: 'Admin',
      route: '/admin',
      active: true,
      children: [
        { label: 'Permissions', route: '/permissions', active: false },
        { label: 'Roles', route: '/roles', active: false },
        { label: 'Users', route: '/users', active: false },
        { label: 'Approval Workflows', route: '/approvals/workflows', active: false },
        { label: 'Approval Requests', route: '/approvals/all-requests', active: false },
        { label: 'Wallet Management', route: '/wallet/admin', active: false }
      ]
    },
    { label: 'My Approvals', route: '/approvals/my-approvals', active: false },
    // { label: 'My Wallet', route: '/my-wallet', active: false },
    // { label: 'My Agent Profile', route: '/agents/my-profile', active: false },
    { label: 'Forums', route: '/forums', active: false },
    { label: 'Areas', route: '/areas', active: false },
    { label: 'Units', route: '/units', active: false },
    { label: 'Agents', route: '/agents', active: false },
    { label: 'Members', route: '/members', active: false },
    { label: 'Death Claims', route: '/death-claims', active: false },
    { label: 'Contributions', route: '/contributions', active: false },
  ]);

  readonly items = computed(() => this.menuItems());

  setMenuItems(items: MenuItem[]): void {
    this.menuItems.set(items);
  }

  addMenuItem(item: MenuItem): void {
    this.menuItems.update(items => [...items, item]);
  }

  /**
   * Add a child menu item under a parent route.
   * If parent not found at root level, no-op.
   */
  addChildMenuItem(parentRoute: string, child: MenuItem): void {
    this.menuItems.update(items =>
      items.map(i => {
        if (i.route === parentRoute) {
          const children = i.children ? [...i.children, child] : [child];
          return { ...i, children };
        }
        return i;
      })
    );
  }

  removeMenuItem(route: string): void {
    const removeRecursive = (items: MenuItem[]): MenuItem[] =>
      items
        .map(item => ({ ...item }))
        .filter(item => item.route !== route)
        .map(item => {
          if (item.children) {
            item.children = removeRecursive(item.children);
          }
          return item;
        });

    this.menuItems.update(items => removeRecursive(items));
  }

  setActiveMenuItem(route: string): void {
    const updateRecursive = (items: MenuItem[]): MenuItem[] =>
      items.map(item => {
        const isActive = item.route === route;
        let children: MenuItem[] | undefined;
        if (item.children) {
          children = updateRecursive(item.children);
          // if any child is active, mark parent active too
          const anyChildActive = children.some(c => c.active);
          return { ...item, active: isActive || anyChildActive, children };
        }
        return { ...item, active: isActive };
      });

    this.menuItems.update(items => updateRecursive(items));
  }

  /**
   * Flatten items into a list — useful for components that expect flat array
   */
  flattenItems(): MenuItem[] {
    const res: MenuItem[] = [];
    const walk = (items: MenuItem[]) => {
      for (const it of items) {
        res.push(it);
        if (it.children) walk(it.children);
      }
    };
    walk(this.menuItems());
    return res;
  }
}
