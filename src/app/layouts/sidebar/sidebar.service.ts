import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'santhwanam_sidebar_expanded';

/**
 * SidebarService - Manages sidebar expansion state with localStorage persistence
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Desktop expanded state (persisted to localStorage)
  readonly expanded = signal<boolean>(this.loadExpandedState());
  
  // Mobile open state (not persisted - transient)
  readonly mobileOpen = signal<boolean>(false);
  
  // Track which menu sections are open
  private readonly openMenus = signal<Set<string>>(new Set());

  constructor() {
    // Persist expanded state changes to localStorage
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expanded()));
    });
  }

  private loadExpandedState(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : true; // Default to expanded
  }

  // Desktop sidebar controls
  setExpanded(expanded: boolean): void {
    this.expanded.set(expanded);
  }

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  // Mobile sidebar controls
  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  openMobile(): void {
    this.mobileOpen.set(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  // Menu section controls
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

  openMenu(menuLabel: string): void {
    this.openMenus.update(set => {
      const newSet = new Set(set);
      newSet.add(menuLabel);
      return newSet;
    });
  }

  closeMenu(menuLabel: string): void {
    this.openMenus.update(set => {
      const newSet = new Set(set);
      newSet.delete(menuLabel);
      return newSet;
    });
  }

  closeAllMenus(): void {
    this.openMenus.set(new Set());
  }
}
