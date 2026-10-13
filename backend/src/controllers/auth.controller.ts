import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/User';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || !(await authService.verifyPassword(password ?? '', user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Пользователь может быть заблокирован, но оставаться в БД (isActive в модели User)
  if (user.isActive === false) {
    return res.status(403).json({ error: 'User is deactivated' });
  }

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);

  res.json({
    user: {
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== 'string' || !refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  let payload: string | JwtPayload;
  try {
    payload = authService.verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  // refresh-токен обязан иметь маркер type:'refresh' (access сюда не пройдёт по секрету,
  // но проверяем явно — на случай смены секрета).
  if (typeof payload === 'string' || payload.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const user = await User.findOne({ username: payload.sub });
  if (!user || user.isActive === false) {
    return res.status(401).json({ error: 'User not found or deactivated' });
  }

  res.json({
    user: {
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
    accessToken: authService.generateAccessToken(user),
    refreshToken: authService.generateRefreshToken(user),
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, fullName } = req.body;

  // Валидация входных данных. Ошибки БД наружу не отдаём (см. error-handler).
  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'username is required' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedUsername = username.trim();

  // role НЕ берём из req.body — иначе любой мог бы создать себе ADMIN.
  const exists = await User.exists({ username: normalizedUsername });
  if (exists) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const hashedPassword = await authService.hashPassword(password);

  const newUser = new User({
    username: normalizedUsername,
    password: hashedPassword,
    fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim() : normalizedUsername,
    role: 'USER',
  });

  await newUser.save();
  res.status(201).json({ message: 'User created successfully' });
});
