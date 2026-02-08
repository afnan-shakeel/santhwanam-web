import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
  },
  // Auth routes (no layout, guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'reset-password/request',
        loadComponent: () => import('./features/auth/reset-password-request/reset-password-request.component').then((m) => m.ResetPasswordRequestComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
      }
    ]
  },
  // Main app routes (with layout, auth required)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent)
      },
      {
        path: 'admin/permissions',
        loadComponent: () => import('./features/permissions/permissions.component').then((m) => m.PermissionsComponent)
      },
      {
        path: 'admin/roles',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/roles/roles.component').then((m) => m.RolesComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/roles/role-form/role-form.component').then((m) => m.RoleFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/roles/role-form/role-form.component').then((m) => m.RoleFormComponent)
          }
        ]
      },
      {
        path: 'admin/approvals/workflows',
        loadComponent: () => import('./features/approvals/approval-workflows/approval-workflows.component').then((m) => m.ApprovalWorkflowsComponent)
      },
      {
        path: 'admin/approvals/all-requests',
        loadComponent: () => import('./features/approvals/all-requests/all-requests.component').then((m) => m.AllRequestsComponent)
      },
      // Forum routes
      {
        path: 'forums',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/forums/forums.component').then((m) => m.ForumsComponent)
          },
          // My Forum Profile (redirect based on user's hierarchy)
          {
            path: 'my-profile',
            loadComponent: () => import('./features/forums/my-forum-profile.component').then((m) => m.MyForumProfileComponent)
          },
          // Forum profile route
          {
            path: ':forumId',
            loadComponent: () => import('./features/forums/forum-profile/forum-profile.component').then((m) => m.ForumProfileComponent),
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/forums/forum-profile/tabs/forum-overview-tab/forum-overview-tab.component').then((m) => m.ForumOverviewTabComponent)
              },
              {
                path: 'areas',
                loadComponent: () => import('./features/forums/forum-profile/tabs/forum-areas-tab/forum-areas-tab.component').then((m) => m.ForumAreasTabComponent)
              },
              {
                path: 'cash-custody',
                loadComponent: () => import('./features/forums/forum-profile/tabs/forum-cash-custody-tab/forum-cash-custody-tab.component').then((m) => m.ForumCashCustodyTabComponent)
              },
              {
                path: 'activity',
                loadComponent: () => import('./features/forums/forum-profile/tabs/forum-activity-tab/forum-activity-tab.component').then((m) => m.ForumActivityTabComponent)
              }
            ]
          }
        ]
      },
      // Area routes
      {
        path: 'areas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/areas/areas.component').then((m) => m.AreasComponent)
          },
          // My Area Profile (redirect based on user's hierarchy)
          {
            path: 'my-profile',
            loadComponent: () => import('./features/areas/my-area-profile.component').then((m) => m.MyAreaProfileComponent)
          },
          // Area profile route
          {
            path: ':areaId',
            loadComponent: () => import('./features/areas/area-profile/area-profile.component').then((m) => m.AreaProfileComponent),
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/areas/area-profile/tabs/area-overview-tab/area-overview-tab.component').then((m) => m.AreaOverviewTabComponent)
              },
              {
                path: 'units',
                loadComponent: () => import('./features/areas/area-profile/tabs/area-units-tab/area-units-tab.component').then((m) => m.AreaUnitsTabComponent)
              },
              {
                path: 'cash-custody',
                loadComponent: () => import('./features/areas/area-profile/tabs/area-cash-custody-tab/area-cash-custody-tab.component').then((m) => m.AreaCashCustodyTabComponent)
              },
              {
                path: 'activity',
                loadComponent: () => import('./features/areas/area-profile/tabs/area-activity-tab/area-activity-tab.component').then((m) => m.AreaActivityTabComponent)
              }
            ]
          }
        ]
      },
      // Unit routes
      {
        path: 'units',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/units/units.component').then((m) => m.UnitsComponent)
          },
          // My Unit Profile (redirect based on user's hierarchy)
          {
            path: 'my-profile',
            loadComponent: () => import('./features/units/my-unit-profile.component').then((m) => m.MyUnitProfileComponent)
          },
          // Unit profile route
          {
            path: ':unitId',
            loadComponent: () => import('./features/units/unit-profile/unit-profile.component').then((m) => m.UnitProfileComponent),
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/units/unit-profile/tabs/unit-overview-tab/unit-overview-tab.component').then((m) => m.UnitOverviewTabComponent)
              },
              {
                path: 'agents',
                loadComponent: () => import('./features/units/unit-profile/tabs/unit-agents-tab/unit-agents-tab.component').then((m) => m.UnitAgentsTabComponent)
              },
              {
                path: 'cash-custody',
                loadComponent: () => import('./features/units/unit-profile/tabs/unit-cash-custody-tab/unit-cash-custody-tab.component').then((m) => m.UnitCashCustodyTabComponent)
              },
              {
                path: 'activity',
                loadComponent: () => import('./features/units/unit-profile/tabs/unit-activity-tab/unit-activity-tab.component').then((m) => m.UnitActivityTabComponent)
              }
            ]
          }
        ]
      },
      // Member's own profile route (self-view)
      {
        path: 'my-profile',
        loadComponent: () => import('./features/members/member-profile/pages/my-profile/my-profile.component').then((m) => m.MyProfileComponent),
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./features/members/member-profile/tabs/member-overview-tab/member-overview-tab.component').then((m) => m.MemberOverviewTabComponent)
          },
          {
            path: 'contributions',
            loadComponent: () => import('./features/members/member-profile/tabs/member-contributions-tab/member-contributions-tab.component').then((m) => m.MemberContributionsTabComponent)
          },
          {
            path: 'nominees',
            loadComponent: () => import('./features/members/member-profile/tabs/member-nominees-tab/member-nominees-tab.component').then((m) => m.MemberNomineesTabComponent)
          },
          {
            path: 'documents',
            loadComponent: () => import('./features/members/member-profile/tabs/member-documents-tab/member-documents-tab.component').then((m) => m.MemberDocumentsTabComponent)
          }
        ]
      },
      // Agent's own profile route
      {
        path: 'agent/profile',
        loadComponent: () => import('./features/agents/agent-profile/agent-profile.component').then((m) => m.AgentProfileComponent),
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./features/agents/agent-profile/tabs/agent-overview-tab/agent-overview-tab.component').then((m) => m.AgentOverviewTabComponent)
          },
          {
            path: 'members',
            loadComponent: () => import('./features/agents/agent-profile/tabs/agent-members-tab/agent-members-tab.component').then((m) => m.AgentMembersTabComponent)
          },
          {
            path: 'pending-contributions',
            loadComponent: () => import('./features/agents/agent-profile/tabs/pending-contributions-tab/pending-contributions-tab.component').then((m) => m.PendingContributionsTabComponent)
          },
          {
            path: 'low-balance',
            loadComponent: () => import('./features/agents/agent-profile/tabs/low-balance-tab/low-balance-tab.component').then((m) => m.LowBalanceTabComponent)
          },
          {
            path: 'cash-custody',
            loadComponent: () => import('./features/agents/agent-profile/tabs/agent-cash-custody-tab/agent-cash-custody-tab.component').then((m) => m.AgentCashCustodyTabComponent)
          }
        ]
      },
      // Agent listing and management routes
      {
        path: 'agents',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/agents/agents.component').then((m) => m.AgentsComponent)
          },
          // Admin viewing agent profile
          {
            path: ':agentId',
            loadComponent: () => import('./features/agents/agent-profile/agent-profile.component').then((m) => m.AgentProfileComponent),
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/agents/agent-profile/tabs/agent-overview-tab/agent-overview-tab.component').then((m) => m.AgentOverviewTabComponent)
              },
              {
                path: 'members',
                loadComponent: () => import('./features/agents/agent-profile/tabs/agent-members-tab/agent-members-tab.component').then((m) => m.AgentMembersTabComponent)
              },
              {
                path: 'pending-contributions',
                loadComponent: () => import('./features/agents/agent-profile/tabs/pending-contributions-tab/pending-contributions-tab.component').then((m) => m.PendingContributionsTabComponent)
              },
              {
                path: 'low-balance',
                loadComponent: () => import('./features/agents/agent-profile/tabs/low-balance-tab/low-balance-tab.component').then((m) => m.LowBalanceTabComponent)
              },
              {
                path: 'cash-custody',
                loadComponent: () => import('./features/agents/agent-profile/tabs/agent-cash-custody-tab/agent-cash-custody-tab.component').then((m) => m.AgentCashCustodyTabComponent)
              },
              {
                path: 'activity',
                loadComponent: () => import('./features/agents/agent-profile/tabs/agent-activity-tab/agent-activity-tab.component').then((m) => m.AgentActivityTabComponent)
              }
            ]
          },
          // Agent viewing member profile
          {
            path: 'members/:memberId',
            loadComponent: () => import('./features/members/member-profile/pages/agent-member-profile/agent-member-profile.component').then((m) => m.AgentMemberProfileComponent),
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/members/member-profile/tabs/member-overview-tab/member-overview-tab.component').then((m) => m.MemberOverviewTabComponent)
              },
              {
                path: 'contributions',
                loadComponent: () => import('./features/members/member-profile/tabs/member-contributions-tab/member-contributions-tab.component').then((m) => m.MemberContributionsTabComponent)
              },
              {
                path: 'nominees',
                loadComponent: () => import('./features/members/member-profile/tabs/member-nominees-tab/member-nominees-tab.component').then((m) => m.MemberNomineesTabComponent)
              },
              {
                path: 'documents',
                loadComponent: () => import('./features/members/member-profile/tabs/member-documents-tab/member-documents-tab.component').then((m) => m.MemberDocumentsTabComponent)
              }
            ]
          },
          // Agent Member Wallet Routes (viewing member wallets as agent)
          {
            path: 'members/:memberId/wallet',
            loadComponent: () => import('./features/wallet/pages/member-wallet/member-wallet.component').then((m) => m.MemberWalletComponent),
            data: { viewMode: 'agent' },
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/wallet/pages/wallet-overview/wallet-overview.component').then((m) => m.WalletOverviewComponent)
              },
              {
                path: 'transactions',
                loadComponent: () => import('./features/wallet/pages/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
              },
              {
                path: 'deposits',
                loadComponent: () => import('./features/wallet/pages/wallet-deposits/wallet-deposits.component').then((m) => m.WalletDepositsComponent)
              }
            ]
          }
        ]
      },
      {
        path: 'members',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/members/members.component').then((m) => m.MembersComponent)
          },
          {
            path: 'add',
            loadComponent: () => import('./features/members/member-form/member-form.component').then((m) => m.MemberFormComponent)
          },
          {
            path: ':memberId/edit',
            loadComponent: () => import('./features/members/member-form/member-form.component').then((m) => m.MemberFormComponent)
          },
          // Admin viewing member profile
          {
            path: ':memberId/profile',
            loadComponent: () => import('./features/members/member-profile/pages/admin-member-profile/admin-member-profile.component').then((m) => m.AdminMemberProfileComponent),
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/members/member-profile/tabs/member-overview-tab/member-overview-tab.component').then((m) => m.MemberOverviewTabComponent)
              },
              {
                path: 'contributions',
                loadComponent: () => import('./features/members/member-profile/tabs/member-contributions-tab/member-contributions-tab.component').then((m) => m.MemberContributionsTabComponent)
              },
              {
                path: 'nominees',
                loadComponent: () => import('./features/members/member-profile/tabs/member-nominees-tab/member-nominees-tab.component').then((m) => m.MemberNomineesTabComponent)
              },
              {
                path: 'documents',
                loadComponent: () => import('./features/members/member-profile/tabs/member-documents-tab/member-documents-tab.component').then((m) => m.MemberDocumentsTabComponent)
              },
              {
                path: 'activity',
                loadComponent: () => import('./features/members/member-profile/tabs/member-activity-tab/member-activity-tab.component').then((m) => m.MemberActivityTabComponent)
              }
            ]
          },
        ]
      },
      // Wallet routes
      {
        path: 'my-wallet',
        loadComponent: () => import('./features/wallet/pages/my-wallet/my-wallet.component').then((m) => m.MyWalletComponent),
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./features/wallet/pages/wallet-overview/wallet-overview.component').then((m) => m.WalletOverviewComponent)
          },
          {
            path: 'transactions',
            loadComponent: () => import('./features/wallet/pages/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
          },
          {
            path: 'deposits',
            loadComponent: () => import('./features/wallet/pages/wallet-deposits/wallet-deposits.component').then((m) => m.WalletDepositsComponent)
          }
        ]
      },
      // Admin Wallet Routes
      {
        path: 'admin/wallets',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/wallet/pages/admin/wallet-dashboard/wallet-dashboard.component').then((m) => m.WalletDashboardComponent)
          },
          {
            path: 'pending-deposits',
            loadComponent: () => import('./features/wallet/pages/admin/pending-deposits/pending-deposits.component').then((m) => m.PendingDepositsComponent)
          },
          {
            path: 'list',
            loadComponent: () => import('./features/wallet/pages/admin/all-wallets/all-wallets.component').then((m) => m.AllWalletsComponent)
          },
          {
            path: 'low-balance',
            loadComponent: () => import('./features/wallet/pages/admin/low-balance-report/low-balance-report.component').then((m) => m.LowBalanceReportComponent)
          },
          {
            path: ':walletId',
            loadComponent: () => import('./features/wallet/pages/member-wallet/member-wallet.component').then((m) => m.MemberWalletComponent),
            data: { viewMode: 'admin' },
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/wallet/pages/wallet-overview/wallet-overview.component').then((m) => m.WalletOverviewComponent)
              },
              {
                path: 'transactions',
                loadComponent: () => import('./features/wallet/pages/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
              },
              {
                path: 'deposits',
                loadComponent: () => import('./features/wallet/pages/wallet-deposits/wallet-deposits.component').then((m) => m.WalletDepositsComponent)
              }
            ]
          }
        ]
      },
      // Contributions routes
      {
        path: 'contributions',
        loadComponent: () => import('./features/contributions/my-contributions/my-contributions.component').then((m) => m.MyContributionsComponent)
      },
      // ═══════════════════════════════════════════════════════════════════════════
      // CASH MANAGEMENT ROUTES
      // ═══════════════════════════════════════════════════════════════════════════
      // Self-service routes (Agent, Admins)
      {
        path: 'cash/my-custody',
        loadComponent: () => import('./features/cash-management/pages/my-custody/my-custody.component').then((m) => m.MyCustodyComponent)
      },
      {
        path: 'cash/handover/new',
        loadComponent: () => import('./features/cash-management/pages/initiate-handover/initiate-handover.component').then((m) => m.InitiateHandoverComponent)
      },
      {
        path: 'cash/pending-receipts',
        loadComponent: () => import('./features/cash-management/pages/pending-receipts/pending-receipts.component').then((m) => m.PendingReceiptsComponent)
      },
      {
        path: 'cash/handover/:handoverId/acknowledge',
        loadComponent: () => import('./features/cash-management/pages/acknowledge-handover/acknowledge-handover.component').then((m) => m.AcknowledgeHandoverComponent)
      },
      {
        path: 'cash/handovers',
        loadComponent: () => import('./features/cash-management/pages/handover-history/handover-history.component').then((m) => m.HandoverHistoryComponent)
      },
      // Admin routes (Forum/Area/Unit Admin, Super Admin)
      {
        path: 'admin/cash/dashboard',
        loadComponent: () => import('./features/cash-management/pages/cash-dashboard/cash-dashboard.component').then((m) => m.CashDashboardComponent)
      },
      {
        path: 'admin/cash/custody-report',
        loadComponent: () => import('./features/cash-management/pages/custody-report/custody-report.component').then((m) => m.CustodyReportComponent)
      },
      {
        path: 'admin/cash/overdue',
        loadComponent: () => import('./features/cash-management/pages/overdue-report/overdue-report.component').then((m) => m.OverdueReportComponent)
      },
      {
        path: 'admin/cash/custody/:custodyId',
        loadComponent: () => import('./features/cash-management/pages/custodian-details/custodian-details.component').then((m) => m.CustodianDetailsComponent)
      },
      {
        path: 'admin/cash/pending-bank-deposits',
        loadComponent: () => import('./features/cash-management/pages/pending-bank-deposits/pending-bank-deposits.component').then((m) => m.PendingBankDepositsComponent)
      },
      // Death Claims routes (v1 — kept for backward compatibility)
      {
        path: 'death-claims',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/death-claims/claims-dashboard/claims-dashboard.component').then((m) => m.ClaimsDashboardComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/death-claims/submit-claim/submit-claim.component').then((m) => m.SubmitClaimComponent)
          },
          {
            path: ':claimId',
            loadComponent: () => import('./features/death-claims/claim-details/claim-details.component').then((m) => m.ClaimDetailsComponent)
          }
        ]
      },
      // Death Claims routes (v2 — redesigned)
      {
        path: 'claims',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/death-claims-v2/pages/claims-listing/claims-listing.component').then((m) => m.ClaimsListingComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/death-claims/submit-claim/submit-claim.component').then((m) => m.SubmitClaimComponent)
          },
          {
            path: 'cycles',
            loadComponent: () => import('./features/death-claims-v2/pages/contribution-cycles/contribution-cycles.component').then((m) => m.ContributionCyclesComponent)
          },
          {
            path: ':claimId',
            loadComponent: () => import('./features/death-claims-v2/pages/claim-details/claim-details.component').then((m) => m.ClaimDetailsV2Component)
          }
        ]
      },
      {
        path: 'approvals/my-approvals',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/approvals/my-approvals/my-approvals.component').then((m) => m.MyApprovalsComponent)
          },
          {
            path: ':requestId',
            loadComponent: () => import('./features/approvals/my-approvals/approval-details.component').then((m) => m.ApprovalDetailsComponent)
          }
        ]
      },
    ]
  },
  // Forbidden page (no layout)
  {
    path: 'forbidden',
    loadComponent: () => import('./shared/pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
