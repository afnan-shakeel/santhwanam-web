import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccessStore } from '../../core/state/access.store';

/**
 * Redirect component for unit admins to access their own unit profile.
 * Reads the user's unit ID from AccessStore and navigates to the profile page.
 */
@Component({
  selector: 'app-my-unit-profile',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  `
})
export class MyUnitProfileComponent implements OnInit {
  private router = inject(Router);
  private accessStore = inject(AccessStore);

  ngOnInit(): void {
    const hierarchy = this.accessStore.hierarchy();
    const unitId = hierarchy?.unitId;
    console.log(hierarchy)
    if (unitId) {
      // Redirect to the actual unit profile
      this.router.navigate(['/units', unitId], { replaceUrl: true });
    } else {
      // User doesn't have a unit assigned, redirect to dashboard
      console.warn('No unit assigned to current user');
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
