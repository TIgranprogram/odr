import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './api';
import { REFRESH_KEY, TOKEN_KEY, USER_KEY } from './auth.tokens';

/** Ответ бэкенда на /api/auth/login */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { username: string; fullName: string; role: string };
}

/**
 * Хранение сессии: токены и профиль в localStorage,
 * реактивное состояние — через Signal (чтобы layout перерисовывался сразу).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthResponse['user'] | null>(readUser());
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  constructor(private http: HttpClient, private router: Router) {}

  get isAuthenticated(): boolean {
    return !!this.token();
  }

  login(username: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API_URL}/api/auth/login`, { username, password })
      .pipe(tap(res => this.persist(res)));
  }

  register(payload: { username: string; password: string; fullName?: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/api/auth/register`, payload).pipe(
      tap(res => this.persist(res))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    if (res.refreshToken) localStorage.setItem(REFRESH_KEY, res.refreshToken);
    if (res.user) localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.token.set(res.accessToken);
    this.user.set(res.user ?? null);
  }
}

function readUser(): AuthResponse['user'] | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse['user']) : null;
  } catch {
    return null;
  }
}
