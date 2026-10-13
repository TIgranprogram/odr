import { Request, Response, NextFunction } from 'express';

/**
 * Простой in-memory rate-limiter (без внешних зависимостей).
 * Ограничивает число запросов с одного IP в окне окна `windowMs`.
 * Достаточно для защиты /login от перебора в одном инстансе.
 */
export const rateLimit = (max: number, windowMs: number) => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    return next();
  };
};
