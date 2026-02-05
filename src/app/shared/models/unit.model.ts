/**
 * Unit Module - Type Definitions
 * Based on OpenAPI spec: Organization Bodies - Units
 */

import { AdminDetails, AdminSummary } from './forum.model';

// ═══════════════════════════════════════════════════════════════════════════
// BASE MODELS
// ═══════════════════════════════════════════════════════════════════════════

export interface Unit {
  unitId: string;
  unitCode: string;
  unitName: string;
  areaId: string;
  adminUserId: string;
  establishedDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT PROFILE RESPONSE
// ═══════════════════════════════════════════════════════════════════════════

export interface UnitWithDetails {
  unitId: string;
  unitCode: string;
  unitName: string;
  establishedDate: string;
  areaId: string;
  areaName: string;
  forumId: string;
  forumName: string;
  adminUserId: string;
  admin: AdminDetails;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT STATS
// ═══════════════════════════════════════════════════════════════════════════

export interface UnitStats {
  unitId: string;
  totalAgents: number;
  activeAgents: number;
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  pendingApprovals: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENTS LIST RESPONSE (FOR UNIT PROFILE)
// ═══════════════════════════════════════════════════════════════════════════

export type AgentListStatus = 'Active' | 'Inactive' | 'Suspended';

export interface AgentListItem {
  agentId: string;
  agentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: AgentListStatus;
  memberCount: number;
}

export interface AgentsListSummary {
  totalAgents: number;
  activeAgents: number;
  totalMembers: number;
}

export interface AgentsListWithSummary {
  summary: AgentsListSummary;
  items: AgentListItem[];
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

export interface CreateUnitRequest {
  areaId: string;
  unitCode: string;
  unitName: string;
  adminUserId: string;
  establishedDate: string;
}

export interface UpdateUnitRequest {
  unitName?: string;
  establishedDate?: string;
}
