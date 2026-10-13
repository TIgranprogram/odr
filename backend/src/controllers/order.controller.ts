import { Request, Response } from 'express';
import * as OrderService from '../services/order.service';
import * as AuditService from '../services/audit.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrgId } from '../utils/tenant';
import {
  ensureObject,
  pickAllowed,
  requireArray,
  requireNumber,
  requireString,
} from '../utils/validate';

const ORDER_FIELDS = [
  'orderNumber', 'customer', 'status', 'items', 'totalAmount', 'orderDate', 'note',
] as const;

const ENTITY = 'orders';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await OrderService.getAll(getOrgId(req));
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, ORDER_FIELDS);

  requireString(allowed.orderNumber, 'orderNumber');
  requireString(allowed.customer, 'customer');
  requireNumber(allowed.totalAmount, 'totalAmount');
  if (allowed.items !== undefined) requireArray(allowed.items, 'items');

  const saved = await OrderService.create({
    ...allowed,
    organizationId: getOrgId(req),
  } as Parameters<typeof OrderService.create>[0]);
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'CREATE', req, after: saved, fields: ORDER_FIELDS,
  });
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await OrderService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, ORDER_FIELDS);

  if (allowed.orderNumber !== undefined) requireString(allowed.orderNumber, 'orderNumber');
  if (allowed.customer !== undefined) requireString(allowed.customer, 'customer');
  if (allowed.totalAmount !== undefined) requireNumber(allowed.totalAmount, 'totalAmount');
  if (allowed.items !== undefined) requireArray(allowed.items, 'items');

  const before = await OrderService.findById(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });

  const updated = await OrderService.update(req.params.id, allowed as Parameters<typeof OrderService.update>[1]);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'UPDATE', req, before, after: updated, fields: ORDER_FIELDS,
  });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const before = await OrderService.findById(req.params.id);
  const deleted = await OrderService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'DELETE', req, before, fields: ORDER_FIELDS,
  });
  res.json({ message: 'Deleted successfully' });
});
