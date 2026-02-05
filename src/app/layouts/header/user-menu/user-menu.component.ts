import { Component, inject, signal, computed, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { AccessStore } from '../../../core/state/access.store';

/**
 * UserMenuComponent - Avatar dropdown with user info and actions
 * 
 * Features:
 * - Shows user avatar/initials
 * - Settings link
 * - Sign out action
 * - Closes on outside click or Escape key
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './user-menu.component.html',
})
export class UserMenuComponent {
  @ViewChild('menuContainer') menuContainer!: ElementRef;
  
  private authService = inject(AuthService);
  private accessStore = inject(AccessStore);
  private router = inject(Router);

  isOpen = signal<boolean>(false);
  user = this.accessStore.user;

  userInitials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.[0] || '';
    const last = u.lastName?.[0] || '';
    return (first + last).toUpperCase() || u.email?.[0]?.toUpperCase() || '?';
  });

  getUserDisplayName(): string {
    const u = this.user();
    if (!u) return 'User';
    
    if (u.firstName && u.lastName) {
      return `${u.firstName} ${u.lastName}`;
    }
    return u.firstName || u.email || 'User';
  }

  toggleMenu(): void {
    this.isOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  signOut(): void {
    this.closeMenu();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // Close on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen() && this.menuContainer && !this.menuContainer.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  // Close on Escape
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenu();
  }
}
