import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'requisitions',
    loadComponent: () => import('./features/requisitions/requisitions.component').then(m => m.RequisitionsComponent)
  },
  {
    path: 'invoices',
    loadComponent: () => import('./features/invoices/invoices.component').then(m => m.InvoicesComponent)
  },
  {
    path: 'dictionaries',
    loadComponent: () => import('./features/dictionaries/dictionaries.component').then(m => m.DictionariesComponent)
  },
  {
    path: 'reports/odr',
    loadComponent: () => import('./features/reports/odr.component').then(m => m.OdrComponent)
  },
  {
    path: 'warehouse',
    loadComponent: () => import('./features/warehouse/warehouse.component').then(m => m.WarehouseComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
