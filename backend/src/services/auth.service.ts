import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

const JWT_SECRET = env.jwtSecret;

interface TokenUser {
  _id?: unknown;
  username?: string;
  fullName?: string;
  role?: string;
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
  };
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Refresh-токен отличается от access-токена маркером `type: 'refresh'` —
 * authMiddleware не пускает ими в API (иначе 7-дневный токен работал бы как access).
 */
export const generateRefreshToken = (user: TokenUser): string => {
  const payload = {
    sub: user.username,
    id: user._id,
    type: 'refresh',
  };
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/** Проверка JWT. Бросает исключение при невалидном/просроченном токене. */
export const verifyToken = (token: string): string | jwt.JwtPayload => {
  return jwt.verify(token, JWT_SECRET);
};
