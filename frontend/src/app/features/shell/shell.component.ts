import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastComponent } from './toast.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/**
 * Оболочка приложения: боковое меню + шапка + <router-outlet>.
 * Единственное место с навигацией — дочерние маршруты рисуются внутри.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">📦</span>
          <span class="brand-name">ODR</span>
        </div>

        <nav class="nav">
          <div class="nav-group">Работа</div>
          @for (item of mainNav; track item) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }

          <div class="nav-group">Аналитика</div>
          @for (item of reportNav; track item) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-line">
            <span class="avatar">{{ initials }}</span>
            <span class="user-name">{{
              auth.user()?.fullName || auth.user()?.username || 'Гость'
            }}</span>
          </div>
          <button class="btn-ghost logout" (click)="auth.logout()">Выйти</button>
        </div>
      </aside>

      <div class="main">
        <header class="header">
          <div class="title">{{ pageTitle }}</div>
          <div class="header-right">
            @if (auth.user(); as u) {
              <span class="muted">{{ u.role }}</span>
            }
          </div>
        </header>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-toast></app-toast>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .shell {
        display: flex;
        min-height: 100vh;
      }

      .sidebar {
        width: 232px;
        flex: 0 0 232px;
        background: var(--sidebar-bg);
        color: var(--sidebar-text);
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .brand-mark {
        font-size: 20px;
      }
      .brand-name {
        font-size: 17px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.04em;
      }

      .nav {
        flex: 1 1 auto;
        padding: 14px 10px;
        overflow-y: auto;
      }
      .nav-group {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        color: #64748b;
        padding: 14px 10px 6px;
        font-weight: 700;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        margin-bottom: 2px;
        border-radius: 6px;
        color: var(--sidebar-text);
        font-size: 13.5px;
        transition:
          background 0.12s,
          color 0.12s;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.07);
        color: #fff;
      }
      .nav-item.active {
        background: var(--primary);
        color: #fff;
        font-weight: 600;
      }
      .nav-icon {
        width: 18px;
        text-align: center;
      }

      .sidebar-footer {
        padding: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .user-line {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        flex: 0 0 28px;
      }
      .user-name {
        font-size: 12.5px;
        color: #e2e8f0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .logout {
        color: #94a3b8;
        padding: 6px 8px;
        font-size: 12px;
      }
      .logout:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }

      .main {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .header {
        height: 56px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .title {
        font-size: 15px;
        font-weight: 700;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 12px;
      }

      .content {
        padding: 24px;
        flex: 1 1 auto;
      }

      @media (max-width: 860px) {
        .sidebar {
          width: 62px;
          flex-basis: 62px;
        }
        .brand-name,
        .nav-item span:last-child,
        .nav-group,
        .user-name {
          display: none;
        }
        .brand,
        .nav-item {
          justify-content: center;
        }
        .sidebar-footer {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ShellComponent {
  readonly mainNav: NavItem[] = [
    { path: '/requisitions', label: 'Заявки', icon: '📋' },
    { path: '/orders', label: 'Заказы', icon: '🧾' },
    { path: '/invoices', label: 'Счета', icon: '💳' },
    { path: '/warehouse', label: 'Склад', icon: '🏬' },
    { path: '/catalog', label: 'Каталог', icon: '🗂️' },
    { path: '/dictionaries', label: 'Справочники', icon: '📚' },
  ];

  readonly reportNav: NavItem[] = [
    { path: '/reports/odr', label: 'ОДР (доходы/расходы)', icon: '📊' },
  ];

  constructor(readonly auth: AuthService) {}

  get initials(): string {
    const u = this.auth.user();
    const src = (u?.fullName || u?.username || '?').trim();
    return src
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  get pageTitle(): string {
    return 'ODR — управление снабжением';
  }
}
