import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

const JWT_SECRET = env.jwtSecret;
const REFRESH_SECRET = env.refreshSecret;

interface TokenUser {
  _id?: unknown;
  username?: string;
  fullName?: string;
  role?: string;
  organizationId?: string;
}

/** Хэширование пароля (10 раундов bcrypt) — используется auth.controller.register. */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const generateAccessToken = (user: TokenUser): string => {
  const payload = {
    sub: user.username,
    id: user._id,
    role: user.role,
    fullName: user.fullName,
    // T-6.1: скоуп организации; fallback — для пользователей без поля в БД
    organizationId: user.organizationId || DEFAULT_ORGANIZATION_ID,
  };
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Refresh-токен отличается от access-токена маркером `type: 'refresh'` И подписан
 * отдельным REFRESH_SECRET — поэтому access-токен не пройдёт verifyRefreshToken,
 * а refresh не пройдёт authMiddleware.
 */
export const generateRefreshToken = (user: TokenUser): string => {
  const payload = {
    sub: user.username,
    id: user._id,
    type: 'refresh',
  };
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/** Проверка access-JWT. Бросает исключение при невалидном/просроченном токене. */
export const verifyToken = (token: string): string | jwt.JwtPayload => {
  return jwt.verify(token, JWT_SECRET);
};

/** Проверка refresh-JWT. Бросает исключение при невалидном/просроченном токене. */
export const verifyRefreshToken = (token: string): jwt.JwtPayload | string => {
  return jwt.verify(token, REFRESH_SECRET);
};
