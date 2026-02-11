import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * Shared BackButtonComponent
 *
 * Reads `returnUrl` from the current route's query params and navigates back
 * using the following fallback chain:
 *   1. `returnUrl` query param → navigate there (validated as relative path)
 *   2. No `returnUrl` → history.back()
 *
 * An optional `fallback` input can override the history.back() default.
 *
 * Usage:
 *   <app-back-button />
 *   <app-back-button fallback="/dashboard" />
 *   <app-back-button label="My Members" />
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button
      type="button"
      (click)="goBack()"
      class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      [attr.aria-label]="label() || 'Go back'">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackButtonComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Optional accessible label / tooltip */
  readonly label = input<string>();

  /** Optional fallback route when no returnUrl and no browser history */
  readonly fallback = input<string>();

  goBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (returnUrl && this.isValidReturnUrl(returnUrl)) {
      this.navigateToReturnUrl(returnUrl);
      return;
    }

    const fallbackRoute = this.fallback();
    if (fallbackRoute) {
      this.router.navigateByUrl(fallbackRoute);
      return;
    }

    history.back();
  }

  /**
   * Validate that returnUrl is a safe relative path.
   * Prevents open redirect vulnerabilities.
   */
  private isValidReturnUrl(url: string): boolean {
    // Must start with '/' (relative path)
    if (!url.startsWith('/')) return false;
    // Must not start with '//' (protocol-relative URL)
    if (url.startsWith('//')) return false;
    // Must not contain protocol schemes
    if (/^\/.*:\/\//i.test(url)) return false;
    return true;
  }

  /**
   * Parse returnUrl preserving any query params and fragments,
   * then navigate via the Angular router.
   */
  private navigateToReturnUrl(returnUrl: string): void {
    try {
      const url = this.router.parseUrl(returnUrl);
      this.router.navigateByUrl(url);
    } catch {
      // If parsing fails, fall back
      history.back();
    }
  }
}
