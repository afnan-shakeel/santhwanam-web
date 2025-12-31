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
        children: [
          {
            path: '',
            loadComponent: () => import('./features/wallet/my-wallet/my-wallet.component').then((m) => m.MyWalletComponent)
          },
          {
            path: 'transactions',
            loadComponent: () => import('./features/wallet/wallet-transactions/wallet-transactions.component').then((m) => m.WalletTransactionsComponent)
          }
        ]
      },
      {
        path: 'wallet/admin',
        loadComponent: () => import('./features/wallet/wallet-management/wallet-management.component').then((m) => m.WalletManagementComponent)
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
