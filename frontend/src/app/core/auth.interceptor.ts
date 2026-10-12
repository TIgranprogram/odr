import { HttpInterceptorFn } from '@angular/common/http';
import { TOKEN_KEY } from './auth.tokens';

/**
 * Подшивает Authorization: Bearer <jwt> ко всем исходящим запросам.
 * Функциональный интерцептор (Angular 15+), подключается в app.config.ts.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
