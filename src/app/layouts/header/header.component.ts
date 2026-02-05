import { Component, input, output, signal } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { UserMenuComponent } from './user-menu/user-menu.component';

/**
 * HeaderComponent - Top header bar with page title, notifications, and user menu
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent, UserMenuComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  pageTitle = input<string>('Dashboard');
  menuToggle = output<void>();
  
  // Placeholder notification count (non-functional)
  notificationCount = signal<number>(0);
}
