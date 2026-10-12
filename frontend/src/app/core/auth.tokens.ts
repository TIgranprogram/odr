/** Ключи хранения сессии. Вынесены отдельно, чтобы interceptor не тянул весь AuthService (и не создавал цикл). */
export const TOKEN_KEY = 'odr.accessToken';
export const REFRESH_KEY = 'odr.refreshToken';
export const USER_KEY = 'odr.user';
