import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
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
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
