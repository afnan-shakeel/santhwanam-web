// src/app/core/menu/menu.config.ts

import { PERMISSIONS } from "../../shared/constants/permissions";

export interface MenuItemConfig {
  label: string;
  route: string;
  icon?: string;
  // Access control (OR logic within each, AND logic between if both provided)
  permissions?: string[];  // User needs ANY of these permissions
  roles?: string[];        // OR user needs ANY of these roles
  // Nested children
  children?: MenuItemConfig[];
}

/**
 * Main application menu configuration
 * 
 * Visibility Rules:
 * - If no permissions/roles specified: always visible
 * - If permissions specified: user needs ANY of the listed permissions
 * - If roles specified: user needs ANY of the listed roles
 * - Parent menus are visible if they have direct access OR any child is visible
 */
export const MENU_CONFIG: MenuItemConfig[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN SECTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    label: 'Admin',
    route: '/admin',
    icon: 'settings',
    roles: ['super_admin', 'forum_admin'],
    children: [
      { 
        label: 'Permissions', 
        route: '/admin/permissions',
        icon: 'key',
        permissions: [PERMISSIONS.IAM.PERMISSION.READ]
      },
      { 
        label: 'Roles', 
        route: '/admin/roles',
        icon: 'badge',
        permissions: [PERMISSIONS.IAM.ROLE.READ]
      },
      { 
        label: 'Users', 
        route: '/admin/users',
        icon: 'manage_accounts',
        permissions: [PERMISSIONS.IAM.USER.READ]
      },
      { 
        label: 'Approval Workflows', 
        route: '/admin/approvals/workflows',
        icon: 'account_tree',
        permissions: [PERMISSIONS.APPROVAL.WORKFLOW.READ]
      },
      { 
        label: 'All Approval Requests', 
        route: '/admin/approvals/all-requests',
        icon: 'checklist',
        roles: ['super_admin', 'forum_admin']
      },
      { 
        label: 'Wallet Management', 
        route: '/admin/wallets',
        icon: 'account_balance',
        permissions: [PERMISSIONS.WALLET.ADJUSTMENT_CREATE, PERMISSIONS.WALLET.REFUND_CREATE]
      },
      {
        label: 'Membership Tiers',
        route: '/admin/tiers',
        icon: 'layers',
        roles: ['super_admin', 'forum_admin']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONAL / SELF-SERVICE
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    label: 'My Approvals', 
    route: '/approvals/my-approvals',
    icon: 'task_alt',
    permissions: [PERMISSIONS.APPROVAL.REQUEST.APPROVE, PERMISSIONS.APPROVAL.REQUEST.REJECT]
  },
  { 
    label: 'My Wallet', 
    route: '/my-wallet',
    icon: 'account_balance_wallet',
    roles: ['member']
  },
  { 
    label: 'My Agent Profile', 
    route: '/agent/profile',
    icon: 'person',
    roles: ['agent']
  },
  { 
    label: 'My Member Profile', 
    route: '/my-profile',
    icon: 'person',
    roles: ['member']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGANIZATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    label: 'Organization Bodies', 
    route: '/',
    icon: '',
    roles: ['forum_admin', 'area_admin', 'unit_admin'],
    // permissions: [PERMISSIONS.ORG.FORUM.READ]
    children:[
      { 
        label: 'Forums', 
        route: '/forums',
        icon: 'forum',
        roles: ['forum_admin']
        // permissions: [PERMISSIONS.ORG.FORUM.READ]
      },
      { 
        label: 'Areas', 
        route: '/areas',
        icon: 'map',
        roles: ['forum_admin', 'area_admin']
        // permissions: [PERMISSIONS.ORG.AREA.READ]
      },
      { 
        label: 'Units', 
        route: '/units',
        icon: 'business',
        roles: ['forum_admin', 'area_admin', 'unit_admin']
        // permissions: [PERMISSIONS.ORG.UNIT.READ]
      },
    ]
  },
  { 
    label: 'Agents', 
    route: '/agents',
    icon: 'support_agent',
    // permissions: [PERMISSIONS.AGENT.READ],
    roles: ['forum_admin', 'area_admin', 'unit_admin']
  },
  { 
    label: 'Members', 
    route: '/members',
    icon: 'groups',
    // permissions: [PERMISSIONS.MEMBER.READ]
    roles: ['forum_admin', 'area_admin', 'unit_admin']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    label: 'Death Claims', 
    route: '/death-claims',
    icon: 'assignment',
    // permissions: [PERMISSIONS.CLAIM.READ]
    roles: ['forum_admin', 'area_admin', 'unit_admin', 'agent']
  },
  { 
    label: 'Contributions', 
    route: '/contributions',
    icon: 'payments',
    roles: ['forum_admin', 'area_admin', 'unit_admin', 'agent']
    // permissions: [PERMISSIONS.CONTRIBUTION.READ, PERMISSIONS.CONTRIBUTION.CYCLE.READ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE (Optional - enable if needed)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    label: 'Finance',
    route: '/finance',
    icon: 'account_balance',
    roles: ['forum_admin'],
    children: [
      {
        label: 'Chart of Accounts',
        route: '/finance/accounts',
        icon: 'list_alt',
        roles: ['forum_admin']
      },
      {
        label: 'Journal Entries',
        route: '/finance/entries',
        icon: 'receipt_long',
        permissions: [PERMISSIONS.GL.ENTRY.READ]
      },
      {
        label: 'Financial Reports',
        route: '/finance/reports',
        icon: 'analytics',
        permissions: [PERMISSIONS.GL.REPORT.VIEW]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS (Optional - enable if needed)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    label: 'Reports',
    route: '/reports',
    icon: 'analytics',
    roles: ['forum_admin'],
    children: [
      {
        label: 'Member Reports',
        route: '/reports/members',
        icon: 'people',
        permissions: [PERMISSIONS.REPORT.MEMBER_VIEW]
      },
      {
        label: 'Agent Reports',
        route: '/reports/agents',
        icon: 'support_agent',
        permissions: [PERMISSIONS.REPORT.AGENT_VIEW]
      },
      {
        label: 'Claim Reports',
        route: '/reports/claims',
        icon: 'assignment',
        permissions: [PERMISSIONS.REPORT.CLAIM_VIEW]
      },
      {
        label: 'Contribution Reports',
        route: '/reports/contributions',
        icon: 'payments',
        permissions: [PERMISSIONS.REPORT.CONTRIBUTION_VIEW]
      },
      {
        label: 'Financial Reports',
        route: '/reports/financial',
        icon: 'monetization_on',
        permissions: [PERMISSIONS.REPORT.FINANCIAL_VIEW]
      },
      {
        label: 'Audit Logs',
        route: '/reports/audit',
        icon: 'history',
        permissions: [PERMISSIONS.REPORT.AUDIT_VIEW]
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// QUICK REFERENCE: Menu visibility by role
// ─────────────────────────────────────────────────────────────────────────────
// 
// Super Admin:     Everything
// Forum Admin:     Admin (partial), Approvals, Org, Operations, Finance, Reports
// Area Admin:      Approvals, Org (Area/Unit/Agent/Member), Operations
// Unit Admin:      Approvals, Org (Unit/Agent/Member), Operations (partial)
// Agent:           My Profile, Members, Death Claims, Contributions (limited)
// Member:          My Wallet, My Contributions (read only)
// 
// ─────────────────────────────────────────────────────────────────────────────