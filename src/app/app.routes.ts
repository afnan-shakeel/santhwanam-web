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
        path: 'team',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent)
      },
      {
        path: 'permissions',
        loadComponent: () => import('./features/permissions/permissions.component').then((m) => m.PermissionsComponent)
      },
      {
        path: 'roles',
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
        path: 'forums',
        loadComponent: () => import('./features/forums/forums.component').then((m) => m.ForumsComponent)
      },
      {
        path: 'areas',
        loadComponent: () => import('./features/areas/areas.component').then((m) => m.AreasComponent)
      },
      {
        path: 'units',
        loadComponent: () => import('./features/units/units.component').then((m) => m.UnitsComponent)
      }
      ,
      {
        path: 'agents',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/agents/agents.component').then((m) => m.AgentsComponent)
          },
          {
            path: 'my-profile',
            loadComponent: () => import('./features/agents/agent-profile/agent-profile.component').then((m) => m.AgentProfileComponent)
          },
          {
            path: ':agentId/profile',
            loadComponent: () => import('./features/agents/agent-profile/agent-profile.component').then((m) => m.AgentProfileComponent)
          },
          // Agent Member Wallet Routes (viewing member wallets as agent)
          {
            path: 'members/:memberId/wallet',
            loadComponent: () => import('./features/wallet/member-wallet-v2/member-wallet-v2.component').then((m) => m.MemberWalletV2Component),
            data: { viewMode: 'agent' },
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/wallet/my-wallet/wallet-overview/wallet-overview.component').then((m) => m.WalletOverviewComponent)
              },
              {
                path: 'transactions',
                loadComponent: () => import('./features/wallet/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
              },
              {
                path: 'deposits',
                loadComponent: () => import('./features/wallet/my-wallet/wallet-deposits/wallet-deposits.component').then((m) => m.WalletDepositsComponent)
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
          {
            path: ':memberId/profile',
            loadComponent: () => import('./features/members/member-profile/member-profile.component').then((m) => m.MemberProfileComponent)
          },
          {
            path: ':memberId/wallet',
            loadComponent: () => import('./features/wallet/member-wallet/member-wallet.component').then((m) => m.MemberWalletComponent)
          },
          {
            path: ':memberId/wallet/transactions',
            loadComponent: () => import('./features/wallet/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
          }
        ]
      },
      // Wallet routes
      {
        path: 'my-wallet',
        loadComponent: () => import('./features/wallet/my-wallet/my-wallet.component').then((m) => m.MyWalletComponent),
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./features/wallet/my-wallet/wallet-overview/wallet-overview.component').then((m) => m.WalletOverviewComponent)
          },
          {
            path: 'transactions',
            loadComponent: () => import('./features/wallet/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
          },
          {
            path: 'deposits',
            loadComponent: () => import('./features/wallet/my-wallet/wallet-deposits/wallet-deposits.component').then((m) => m.WalletDepositsComponent)
          }
        ]
      },
      // Admin Wallet Routes
      {
        path: 'admin/wallets',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/wallet/admin/wallet-dashboard/wallet-dashboard.component').then((m) => m.WalletDashboardComponent)
          },
          {
            path: 'pending-deposits',
            loadComponent: () => import('./features/wallet/admin/pending-deposits/pending-deposits.component').then((m) => m.PendingDepositsComponent)
          },
          {
            path: 'list',
            loadComponent: () => import('./features/wallet/admin/all-wallets/all-wallets.component').then((m) => m.AllWalletsComponent)
          },
          {
            path: 'low-balance',
            loadComponent: () => import('./features/wallet/admin/low-balance-report/low-balance-report.component').then((m) => m.LowBalanceReportComponent)
          },
          {
            path: ':walletId',
            loadComponent: () => import('./features/wallet/member-wallet-v2/member-wallet-v2.component').then((m) => m.MemberWalletV2Component),
            data: { viewMode: 'admin' },
            children: [
              {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
              },
              {
                path: 'overview',
                loadComponent: () => import('./features/wallet/my-wallet/wallet-overview/wallet-overview.component').then((m) => m.WalletOverviewComponent)
              },
              {
                path: 'transactions',
                loadComponent: () => import('./features/wallet/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
              },
              {
                path: 'deposits',
                loadComponent: () => import('./features/wallet/my-wallet/wallet-deposits/wallet-deposits.component').then((m) => m.WalletDepositsComponent)
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
      // Death Claims routes
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
      {
        path: 'approvals/workflows',
        loadComponent: () => import('./features/approvals/approval-workflows/approval-workflows.component').then((m) => m.ApprovalWorkflowsComponent)
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
      {
        path: 'approvals/all-requests',
        loadComponent: () => import('./features/approvals/all-requests/all-requests.component').then((m) => m.AllRequestsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
