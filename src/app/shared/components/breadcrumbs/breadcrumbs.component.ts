import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  current?: boolean;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css']
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];

  trackByRoute(index: number, item: BreadcrumbItem) {
    return item.route ?? item.label ?? index;
  }
}
