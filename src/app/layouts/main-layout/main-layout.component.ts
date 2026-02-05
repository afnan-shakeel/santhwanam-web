import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarService } from '../sidebar/sidebar.service';
import { LayoutService } from '../layout.service';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastContainerComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private sidebarService = inject(SidebarService);
  private layoutService = inject(LayoutService);

  // Sidebar state
  sidebarExpanded = this.sidebarService.expanded;
  mobileSidebarOpen = this.sidebarService.mobileOpen;
  
  // Page title from route data
  pageTitle = this.layoutService.pageTitle;

  onSidebarExpandedChange(expanded: boolean): void {
    this.sidebarService.setExpanded(expanded);
  }

  onMobileSidebarClose(): void {
    this.sidebarService.closeMobile();
  }

  onMenuToggle(): void {
    this.sidebarService.toggleMobile();
  }
}

