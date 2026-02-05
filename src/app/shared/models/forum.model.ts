/**
 * Forum Module - Type Definitions
 * Based on OpenAPI spec: Organization Bodies - Forums
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE MODELS
// ═══════════════════════════════════════════════════════════════════════════

export interface Forum {
  forumId: string;
  forumCode: string;
  forumName: string;
  adminUserId: string;
  establishedDate: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DETAILS
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminDetails {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface AdminSummary {
  userId: string;
  name: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORUM PROFILE RESPONSE
// ═══════════════════════════════════════════════════════════════════════════

export interface ForumWithDetails {
  forumId: string;
  forumCode: string;
  forumName: string;
  establishedDate: string;
  adminUserId: string;
  admin: AdminDetails;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORUM STATS
// ═══════════════════════════════════════════════════════════════════════════

export interface ForumStats {
  forumId: string;
  totalAreas: number;
  totalUnits: number;
  totalAgents: number;
  activeAgents: number;
  totalMembers: number;
  activeMembers: number;
  pendingApprovals: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// AREAS LIST RESPONSE (FOR FORUM PROFILE)
// ═══════════════════════════════════════════════════════════════════════════

export interface AreaListItem {
  areaId: string;
  areaCode: string;
  areaName: string;
  establishedDate: string;
  unitCount: number;
  memberCount: number;
  admin: AdminSummary;
}

export interface AreasListSummary {
  totalAreas: number;
  totalUnits: number;
  totalMembers: number;
}

export interface AreasListWithSummary {
  summary: AreasListSummary;
  items: AreaListItem[];
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

export interface CreateForumRequest {
  forumCode: string;
  forumName: string;
  adminUserId: string;
  establishedDate: string;
}

export interface UpdateForumRequest {
  forumName?: string;
  establishedDate?: string;
}

export interface AssignAdminRequest {
  newAdminUserId: string;
}
