/**
 * Расширение типов Express: вместо (req as any).user работаем с req.user.
 * Заполняется в auth.middleware после проверки JWT.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        /** username (sub из JWT) */
        sub?: string;
        /** _id пользователя */
        id?: string;
        role?: string;
        fullName?: string;
        /** 'refresh' — только для refresh-токенов, в API-запросах недопустимо */
        type?: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
