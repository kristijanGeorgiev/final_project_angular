
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [

  // ============================================================
  // DEFAULT ROUTE
  // ============================================================

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // ============================================================
  // AUTHENTICATION - PUBLIC ROUTES
  // ============================================================

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login')
        .then(m => m.Login)
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized')
        .then(m => m.Unauthorized)
  },

  // ============================================================
  // DASHBOARD - AUTHENTICATED USERS
  // ============================================================

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(m => m.Dashboard)
  },

  // ============================================================
  // CLIENTS - AUTHENTICATED USERS
  // ============================================================

  {
    path: 'clients',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/clients/client-list/client-list')
        .then(m => m.ClientList)
  },

  {
    path: 'clients/create',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/clients/client-form/client-form')
        .then(m => m.ClientForm)
  },

  {
    path: 'clients/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/clients/client-edit/client-edit')
        .then(m => m.ClientEdit)
  },

  {
    path: 'clients/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/clients/client-detail/client-detail')
        .then(m => m.ClientDetail)
  },

  // ============================================================
  // CLIENT TYPES - AUTHENTICATED USERS
  // ============================================================

  {
    path: 'client-types',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/client-types/client-type-list/client-type-list')
        .then(m => m.ClientTypeList)
  },

  {
    path: 'client-types/create',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/client-types/client-type-form/client-type-form')
        .then(m => m.ClientTypeForm)
  },

  {
    path: 'client-types/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/client-types/client-type-edit/client-type-edit')
        .then(m => m.ClientTypeEdit)
  },

  {
    path: 'client-types/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/client-types/client-type-detail/client-type-detail')
        .then(m => m.ClientTypeDetail)
  },

  // ============================================================
  // FALLBACK ROUTE
  // ============================================================

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];