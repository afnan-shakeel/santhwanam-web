import { Routes } from '@angular/router';

import { HomeComponent } from './features/home/home.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'about',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
