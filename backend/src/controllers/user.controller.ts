import { Request, Response } from 'express';
import * as UserService from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import {
  ensureObject,
  optionalString,
  pickAllowed,
  requireEnum,
  requireString,
} from '../utils/validate';

const ROLES = ['ADMIN', 'USER'] as const;

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await UserService.listUsers());
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const username = requireString(body.username, 'username');
  const password = requireString(body.password, 'password');
  const role = body.role === undefined ? 'USER' : requireEnum(body.role, 'role', ROLES);
  const fullName = optionalString(body.fullName, 'fullName') || username;

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const created = await UserService.createUser(username, password, fullName, role);
  res.status(201).json(created);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, ['fullName', 'role', 'isActive', 'password'] as const);
  const updates: { fullName?: string; role?: 'ADMIN' | 'USER'; isActive?: boolean; password?: string } = {};

  if (allowed.fullName !== undefined) updates.fullName = requireString(allowed.fullName, 'fullName');
  if (allowed.role !== undefined) updates.role = requireEnum(allowed.role, 'role', ROLES);
  if (allowed.isActive !== undefined) updates.isActive = Boolean(allowed.isActive);
  if (allowed.password !== undefined) {
    updates.password = requireString(allowed.password, 'password');
    if (updates.password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
  }

  const updated = await UserService.updateUser(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const ok = await UserService.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
