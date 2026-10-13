import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, share, switchMap, throwError } from 'rxjs';
import { API_URL } from './api';
import { REFRESH_KEY, TOKEN_KEY, USER_KEY } from './auth.tokens';
import { ToastService } from './services/toast.service';

interface RefreshPair {
  accessToken: string;
  refreshToken: string;
  user?: { username: string; fullName: string; role: string };
}

/**
 * Общий in-flight refresh: если несколько запросов одновременно получат 401,
 * refresh выполнится ОДИН раз, остальные дождутся результата.
 */
let refreshInFlight: Observable<RefreshPair> | null = null;

/**
 * Подшивает Authorization: Bearer <jwt> ко всем исходящим запросам (Angular 15+).
 * При 401 на защищённый запрос — одна попытка POST /api/auth/refresh и повтор
 * исходного запроса. Если refresh не удался — сессия очищается и переход на /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = localStorage.getItem(TOKEN_KEY);
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // login/refresh не должны провоцировать рекурсивный refresh
  const isAuthCall = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      const err = error as HttpErrorResponse;

      // 403 — доступ запрещён (напр. не ADMIN). 401 на /login — не ошибка сессии.
      if (err.status === 403) {
        toast.error('Доступ запрещён');
        return throwError(() => error);
      }

      if (err.status !== 401 || isAuthCall) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) {
        forceLogout(router, toast);
        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = http
          .post<RefreshPair>(`${API_URL}/api/auth/refresh`, { refreshToken })
          .pipe(
            share(),
            finalize(() => {
              refreshInFlight = null;
            }),
          );
      }

      return refreshInFlight.pipe(
        switchMap(pair => {
          localStorage.setItem(TOKEN_KEY, pair.accessToken);
          if (pair.refreshToken) localStorage.setItem(REFRESH_KEY, pair.refreshToken);
          if (pair.user) localStorage.setItem(USER_KEY, JSON.stringify(pair.user));
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${pair.accessToken}` },
          });
          return next(retried);
        }),
        catchError((refreshError: unknown) => {
          forceLogout(router, toast);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function forceLogout(router: Router, toast: ToastService): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  toast.info('Сессия истекла, войдите заново');
  if (!router.url.startsWith('/login')) {
    router.navigate(['/login']);
  }
}
