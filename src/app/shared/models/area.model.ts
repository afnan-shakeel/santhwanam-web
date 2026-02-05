/**
 * Area Module - Type Definitions
 * Based on OpenAPI spec: Organization Bodies - Areas
 */

import { AdminDetails, AdminSummary } from './forum.model';

// ═══════════════════════════════════════════════════════════════════════════
// BASE MODELS
// ═══════════════════════════════════════════════════════════════════════════

export interface Area {
  areaId: string;
  areaCode: string;
  areaName: string;
  forumId: string;
  adminUserId: string;
  establishedDate: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// AREA PROFILE RESPONSE
// ═══════════════════════════════════════════════════════════════════════════

export interface AreaWithDetails {
  areaId: string;
  areaCode: string;
  areaName: string;
  establishedDate: string;
  forumId: string;
  forumName: string;
  adminUserId: string;
  admin: AdminDetails;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AREA STATS
// ═══════════════════════════════════════════════════════════════════════════

export interface AreaStats {
  areaId: string;
  totalUnits: number;
  totalAgents: number;
  activeAgents: number;
  totalMembers: number;
  activeMembers: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNITS LIST RESPONSE (FOR AREA PROFILE)
// ═══════════════════════════════════════════════════════════════════════════

export interface UnitListItem {
  unitId: string;
  unitCode: string;
  unitName: string;
  establishedDate: string;
  agentCount: number;
  memberCount: number;
  admin: AdminSummary;
}

export interface UnitsListSummary {
  totalUnits: number;
  totalAgents: number;
  totalMembers: number;
}

export interface UnitsListWithSummary {
  summary: UnitsListSummary;
  items: UnitListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST MODELS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateAreaRequest {
  forumId: string;
  areaCode: string;
  areaName: string;
  adminUserId: string;
  establishedDate: string;
}

export interface UpdateAreaRequest {
  areaName?: string;
  establishedDate?: string;
}
