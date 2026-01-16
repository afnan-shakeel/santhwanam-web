import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AccessStore } from '../../../core/state/access.store';

/**
 * Forbidden (403) page component
 * Displayed when user lacks permission to access a resource
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './forbidden.component.html'
})
export class ForbiddenComponent {
  private router = inject(Router);
  private accessStore = inject(AccessStore);

  readonly user = this.accessStore.user;
  readonly scopeType = this.accessStore.scopeType;

  goBack(): void {
    // Navigate back in history or to dashboard
    if (window.history.length > 2) {
      window.history.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
