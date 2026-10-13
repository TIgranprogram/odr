import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    // Refresh-токен (7 дней) не должен работать как access-токен в API
    if (decoded.type === 'refresh') {
      return res.status(401).json({ error: 'Refresh token cannot be used as access token' });
    }

    // T-6.1: старые токены без organizationId получают fallback 'default-org',
    // чтобы single-tenant деплой продолжал работать без перелогина.
    req.user = { ...decoded, organizationId: decoded.organizationId || DEFAULT_ORGANIZATION_ID };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
