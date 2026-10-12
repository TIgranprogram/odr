import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Обёртка для async-контроллеров: пробрасывает исключения в глобальный
 * error-handler (server.ts), чтобы не дублировать try/catch в каждом методе.
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
