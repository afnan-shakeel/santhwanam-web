import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { AdminDetails } from '../../models/forum.model';

export type EntityType = 'forum' | 'area' | 'unit';

export interface EntityHierarchy {
  areaId?: string;
  areaName?: string;
  forumId?: string;
  forumName?: string;
}

@Component({
  selector: 'app-entity-profile-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './entity-profile-header.component.html',
  styleUrl: './entity-profile-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityProfileHeaderComponent {
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Type of entity being displayed */
  readonly entityType = input.required<EntityType>();

  /** Entity name (e.g., "Ruwi Central Unit") */
  readonly entityName = input.required<string>();

  /** Entity code (e.g., "UNIT-001") */
  readonly entityCode = input.required<string>();

  /** Parent hierarchy for breadcrumb display */
  readonly hierarchy = input<EntityHierarchy>();

  /** Admin user details */
  readonly admin = input.required<AdminDetails>();

  /** Whether this is the logged-in user's own entity profile */
  readonly isOwnProfile = input<boolean>(false);

  /** Whether the user can edit this entity */
  readonly canEdit = input<boolean>(false);

  /** Whether the user can reassign admin */
  readonly canReassignAdmin = input<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  readonly onEdit = output<void>();
  readonly onReassignAdmin = output<void>();
  readonly onNavigateToHierarchy = output<{ type: 'forum' | 'area'; id: string }>();

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Icon based on entity type */
  readonly entityIcon = computed(() => {
    const icons: Record<EntityType, string> = {
      forum: '🌐',
      area: '📍',
      unit: '🏢'
    };
    return icons[this.entityType()];
  });

  /** Entity type label for display */
  readonly entityTypeLabel = computed(() => {
    const labels: Record<EntityType, string> = {
      forum: 'Forum',
      area: 'Area',
      unit: 'Unit'
    };
    return labels[this.entityType()];
  });

  /** Hierarchy breadcrumb display */
  readonly hierarchyDisplay = computed(() => {
    const h = this.hierarchy();
    if (!h) return null;

    const type = this.entityType();
    if (type === 'unit' && h.areaName && h.forumName) {
      return [
        { type: 'area' as const, id: h.areaId!, name: h.areaName },
        { type: 'forum' as const, id: h.forumId!, name: h.forumName }
      ];
    }
    if (type === 'area' && h.forumName) {
      return [
        { type: 'forum' as const, id: h.forumId!, name: h.forumName }
      ];
    }
    return null;
  });

  /** Admin display name */
  readonly adminDisplayName = computed(() => {
    const admin = this.admin();
    return admin?.name || 'Not Assigned';
  });

  /** Admin email */
  readonly adminEmail = computed(() => {
    return this.admin()?.email || '';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  handleEdit(): void {
    this.onEdit.emit();
  }

  handleReassignAdmin(): void {
    this.onReassignAdmin.emit();
  }

  handleHierarchyClick(item: { type: 'forum' | 'area'; id: string }): void {
    this.onNavigateToHierarchy.emit(item);
  }
}
