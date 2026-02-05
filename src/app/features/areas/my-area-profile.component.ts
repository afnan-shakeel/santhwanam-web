import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccessStore } from '../../core/state/access.store';

/**
 * Redirect component for area admins to access their own area profile.
 * Reads the user's area ID from AccessStore and navigates to the profile page.
 */
@Component({
  selector: 'app-my-area-profile',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  `
})
export class MyAreaProfileComponent implements OnInit {
  private router = inject(Router);
  private accessStore = inject(AccessStore);

  ngOnInit(): void {
    const hierarchy = this.accessStore.hierarchy();
    const areaId = hierarchy?.areaId;

    if (areaId) {
      // Redirect to the actual area profile
      this.router.navigate(['/areas', areaId], { replaceUrl: true });
    } else {
      // User doesn't have an area assigned, redirect to dashboard
      console.warn('No area assigned to current user');
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
