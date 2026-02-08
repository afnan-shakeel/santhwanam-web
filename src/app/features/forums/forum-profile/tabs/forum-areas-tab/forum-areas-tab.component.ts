import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { ForumService } from '../../../../../core/services/forum.service';
import { AreasListWithSummary, AreaListItem } from '../../../../../shared/models/forum.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-forum-areas-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, BadgeComponent],
  templateUrl: './forum-areas-tab.component.html',
  styleUrls: ['./forum-areas-tab.component.css']
})
export class ForumAreasTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private forumService = inject(ForumService);

  forumId = signal<string>('');
  loading = signal(true);
  areasData = signal<AreasListWithSummary | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed values for easy access
  areas = computed(() => this.areasData()?.items || []);
  summary = computed(() => this.areasData()?.summary);
  pagination = computed(() => this.areasData()?.pagination);
  totalPages = computed(() => this.pagination()?.totalPages || 1);
  totalItems = computed(() => this.pagination()?.totalItems || 0);

  ngOnInit(): void {
    // Get forumId from parent route params
    const forumId = this.route.parent?.snapshot.params['forumId'];
    if (forumId) {
      this.forumId.set(forumId);
      this.loadAreas();
    }
  }

  loadAreas(): void {
    this.loading.set(true);
    this.forumService.getForumAreas(this.forumId(), this.currentPage(), this.pageSize())
      .subscribe({
        next: (data) => {
          this.areasData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading areas:', err);
          this.loading.set(false);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAreas();
  }

  getAdminInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
