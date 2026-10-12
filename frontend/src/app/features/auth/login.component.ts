import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <span class="logo">📦</span>
          <h1>ODR</h1>
          <p class="muted">Система автоматизации снабжения и учёта</p>
        </div>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="field">
            <label for="username">Имя пользователя</label>
            <input
              id="username"
              name="username"
              type="text"
              [(ngModel)]="username"
              autocomplete="username"
              required
              autofocus
            />
          </div>

          <div class="field">
            <label for="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              autocomplete="current-password"
              required
            />
          </div>

          <button type="submit" class="btn-primary submit" [disabled]="loading || f.invalid">
            <span *ngIf="!loading">Войти</span>
            <span *ngIf="loading">Вход…</span>
          </button>
        </form>

        <p class="hint muted">
          Нет учётной записи? Обратитесь к администратору системы.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      padding: 20px;
    }
    .login-card {
      width: 100%; max-width: 380px;
      background: #fff; border-radius: 12px;
      padding: 34px 30px;
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
    }
    .login-brand { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 38px; display: block; margin-bottom: 6px; }
    h1 { margin: 0; font-size: 26px; letter-spacing: .06em; }
    .login-brand p { margin: 4px 0 0; font-size: 13px; }
    .submit { width: 100%; padding: 11px; margin-top: 6px; font-size: 14px; }
    .hint { text-align: center; font-size: 12px; margin: 18px 0 0; }
  `],
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  onSubmit(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/requisitions';
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        this.loading = false;
        this.error =
          err?.error?.error ||
          (err?.status === 401 ? 'Неверное имя пользователя или пароль' : 'Не удалось войти. Сервер недоступен?');
      },
    });
  }
}
