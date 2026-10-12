import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TOKEN_KEY } from './auth.tokens';

/** Закрывает приватные маршруты: без токена — редирект на /login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  return hasToken ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Для страницы логина: если уже авторизован — уводим в приложение. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return !localStorage.getItem(TOKEN_KEY) ? true : router.createUrlTree(['/requisitions']);
};
