import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth.guard';

/**
 * Вложенные маршруты внутри shell-layout (sidebar + header).
 * Все защищены authGuard — без токена всегда уводит на /login.
 */
export const SHELL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('../shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'requisitions' },
      {
        path: 'requisitions',
        loadComponent: () => import('../requisitions/requisitions.component').then(m => m.RequisitionsComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('../orders/orders.component').then(m => m.OrdersComponent),
      },
      {
        path: 'invoices',
        loadComponent: () => import('../invoices/invoices.component').then(m => m.InvoicesComponent),
      },
      {
        path: 'warehouse',
        loadComponent: () => import('../warehouse/warehouse.component').then(m => m.WarehouseComponent),
      },
      {
        path: 'catalog',
        loadComponent: () => import('../catalog/catalog.component').then(m => m.CatalogComponent),
      },
      {
        path: 'dictionaries',
        loadComponent: () => import('../dictionaries/dictionaries.component').then(m => m.DictionariesComponent),
      },
      {
        path: 'reports/odr',
        loadComponent: () => import('../reports/odr.component').then(m => m.OdrComponent),
      },
      { path: '**', redirectTo: 'requisitions' },
    ],
  },
];
