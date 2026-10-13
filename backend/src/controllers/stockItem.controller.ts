import { Request, Response } from 'express';
import * as StockItemService from '../services/stockItem.service';
import * as AuditService from '../services/audit.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrgId } from '../utils/tenant';

const STOCK_ITEM_FIELDS = [
  'name', 'category', 'unit', 'initialStock', 'received', 'reserved', 'writtenOff',
  'currentStock', 'freeStock', 'status', 'minStock', 'weight', 'categoryRef', 'unitRef',
] as const;

const ENTITY = 'stockItems';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await StockItemService.getAll(getOrgId(req));
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const saved = await StockItemService.create({ ...req.body, organizationId: getOrgId(req) });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'CREATE', req, after: saved, fields: STOCK_ITEM_FIELDS,
  });
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await StockItemService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const before = await StockItemService.findById(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });

  const updated = await StockItemService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'UPDATE', req, before, after: updated, fields: STOCK_ITEM_FIELDS,
  });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const before = await StockItemService.findById(req.params.id);
  const deleted = await StockItemService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'DELETE', req, before, fields: STOCK_ITEM_FIELDS,
  });
  res.json({ message: 'Deleted successfully' });
});
