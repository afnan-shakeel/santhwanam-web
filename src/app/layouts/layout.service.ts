import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * LayoutService - Manages layout-related state
 * - Page title from route data
 * - Mobile detection
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // Page title derived from route data
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

  readonly pageTitle = toSignal(this.pageTitle$, { initialValue: 'Dashboard' });

  // Mobile detection (< 1024px = lg breakpoint)
  readonly isMobile = signal<boolean>(this.checkMobile());

  constructor() {
    // Listen for window resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.isMobile.set(this.checkMobile());
      });
    }
  }

  private checkMobile(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  }
}
