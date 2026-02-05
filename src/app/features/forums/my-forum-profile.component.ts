import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccessStore } from '../../core/state/access.store';

/**
 * Redirect component for forum admins to access their own forum profile.
 * Reads the user's forum ID from AccessStore and navigates to the profile page.
 */
@Component({
  selector: 'app-my-forum-profile',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  `
})
export class MyForumProfileComponent implements OnInit {
  private router = inject(Router);
  private accessStore = inject(AccessStore);

  ngOnInit(): void {
    const hierarchy = this.accessStore.hierarchy();
    const forumId = hierarchy?.forumId;

    if (forumId) {
      // Redirect to the actual forum profile
      this.router.navigate(['/forums', forumId], { replaceUrl: true });
    } else {
      // User doesn't have a forum assigned, redirect to dashboard
      console.warn('No forum assigned to current user');
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
