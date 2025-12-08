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
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
