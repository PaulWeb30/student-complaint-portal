import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'complaints',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'complaints',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/complaints/complaints.page').then((m) => m.ComplaintsPage),
  },
  {
    path: 'admin/complaints',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin-complaints/admin-complaints.page').then((m) => m.AdminComplaintsPage),
  },
  {
    path: '**',
    redirectTo: 'complaints',
  },
];
