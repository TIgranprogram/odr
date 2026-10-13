import { Request, Response } from 'express';
import * as WarehouseService from '../services/warehouse.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrgId } from '../utils/tenant';
import {
  ensureObject,
  optionalString,
  pickAllowed,
  requireEnum,
  requireNumber,
  requireString,
} from '../utils/validate';

const MOVEMENT_FIELDS = ['date', 'type', 'itemName', 'quantity', 'unit', 'targetOrderItemRef', 'note'] as const;
const MOVEMENT_TYPES = ['INCOME', 'OUTCOME'] as const;

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await WarehouseService.getAll(getOrgId(req));
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, MOVEMENT_FIELDS);

  requireString(allowed.itemName, 'itemName');
  requireNumber(allowed.quantity, 'quantity');
  if (allowed.type !== undefined) requireEnum(allowed.type, 'type', MOVEMENT_TYPES);
  optionalString(allowed.unit, 'unit');
  optionalString(allowed.note, 'note');

  const saved = await WarehouseService.create({
    ...allowed,
    organizationId: getOrgId(req),
  } as Parameters<typeof WarehouseService.create>[0]);
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await WarehouseService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, MOVEMENT_FIELDS);
  if (allowed.itemName !== undefined) requireString(allowed.itemName, 'itemName');
  if (allowed.quantity !== undefined) requireNumber(allowed.quantity, 'quantity');
  if (allowed.type !== undefined) requireEnum(allowed.type, 'type', MOVEMENT_TYPES);

  const updated = await WarehouseService.update(req.params.id, allowed as Parameters<typeof WarehouseService.update>[1]);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await WarehouseService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
