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

export type EntityType = 'forum' | 'area' | 'unit' | 'agent';

export interface EntityHierarchy {
  forum?: { id: string; name: string } | null;
  area?: { id: string; name: string } | null;
  unit?: { id: string; name: string } | null;
  // Legacy support
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

  /** Admin user details - optional for agents */
  readonly admin = input<AdminDetails | null>();

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
  readonly onNavigateToHierarchy = output<{ type: 'forum' | 'area' | 'unit'; id: string }>();

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Icon based on entity type */
  readonly entityIcon = computed(() => {
    const icons: Record<EntityType, string> = {
      forum: '🌐',
      area: '📍',
      unit: '🏢',
      agent: '👤'
    };
    return icons[this.entityType()];
  });

  /** Entity type label for display */
  readonly entityTypeLabel = computed(() => {
    const labels: Record<EntityType, string> = {
      forum: 'Forum',
      area: 'Area',
      unit: 'Unit',
      agent: 'Agent'
    };
    return labels[this.entityType()];
  });

  /** Whether this is an agent profile (hides admin section) */
  readonly isAgent = computed(() => this.entityType() === 'agent');

  /** Hierarchy breadcrumb display */
  readonly hierarchyDisplay = computed(() => {
    const h = this.hierarchy();
    if (!h) return null;

    const type = this.entityType();
    const items: { type: 'forum' | 'area' | 'unit'; id: string; name: string }[] = [];

    // For agent: show unit → area → forum
    if (type === 'agent') {
      if (h.unit) items.push({ type: 'unit', id: h.unit.id, name: h.unit.name });
      if (h.area) items.push({ type: 'area', id: h.area.id, name: h.area.name });
      if (h.forum) items.push({ type: 'forum', id: h.forum.id, name: h.forum.name });
      return items.length > 0 ? items : null;
    }

    // Legacy support for unit/area
    if (type === 'unit' && (h.areaName || h.area) && (h.forumName || h.forum)) {
      return [
        { type: 'area' as const, id: h.areaId || h.area?.id || '', name: h.areaName || h.area?.name || '' },
        { type: 'forum' as const, id: h.forumId || h.forum?.id || '', name: h.forumName || h.forum?.name || '' }
      ];
    }
    if (type === 'area' && (h.forumName || h.forum)) {
      return [
        { type: 'forum' as const, id: h.forumId || h.forum?.id || '', name: h.forumName || h.forum?.name || '' }
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

  handleHierarchyClick(item: { type: 'forum' | 'area' | 'unit'; id: string }): void {
    this.onNavigateToHierarchy.emit(item);
  }
}
