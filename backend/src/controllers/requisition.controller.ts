import { Request, Response } from 'express';
import * as RequisitionService from '../services/requisition.service';
import { asyncHandler } from '../utils/asyncHandler';
import {
  ensureObject,
  optionalString,
  pickAllowed,
  requireEnum,
  requireNumber,
  requireString,
} from '../utils/validate';

const REQUISITION_FIELDS = [
  'date', 'category', 'itemName', 'sku', 'unit', 'quantity', 'requestedBy', 'priority',
  'status', 'company', 'customer', 'orderRef', 'orderItemRef', 'supplier', 'link', 'color',
  'note', 'invoiceRef', 'priceWithVat',
] as const;

const PRIORITIES = ['Срочно', 'Обычный', 'Низко'] as const;
const COMPANIES = ['СИЮ', 'ССЮ'] as const;

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await RequisitionService.getAll(req.query);
  res.json(items);
});

export const getPaged = asyncHandler(async (req: Request, res: Response) => {
  const result = await RequisitionService.getPaged(req.query);
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, REQUISITION_FIELDS);

  // Обязательные поля (остальные — со значениями по умолчанию модели).
  requireString(allowed.itemName, 'itemName');
  requireNumber(allowed.quantity, 'quantity');
  requireNumber(allowed.priceWithVat, 'priceWithVat');
  if (allowed.priority !== undefined) requireEnum(allowed.priority, 'priority', PRIORITIES);
  if (allowed.company !== undefined) requireEnum(allowed.company, 'company', COMPANIES);
  optionalString(allowed.status, 'status');

  // Фронт НЕ присылает requestedBy — подставляем автора из токена (поле required в модели)
  const requestedBy = req.user?.fullName || req.user?.sub || optionalString(allowed.requestedBy, 'requestedBy') || '';

  const saved = await RequisitionService.create({ ...allowed, requestedBy } as Parameters<typeof RequisitionService.create>[0]);
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await RequisitionService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, REQUISITION_FIELDS);

  // Валидируем только переданные поля (partial update).
  if (allowed.itemName !== undefined) requireString(allowed.itemName, 'itemName');
  if (allowed.quantity !== undefined) requireNumber(allowed.quantity, 'quantity');
  if (allowed.priceWithVat !== undefined) requireNumber(allowed.priceWithVat, 'priceWithVat');
  if (allowed.priority !== undefined) requireEnum(allowed.priority, 'priority', PRIORITIES);
  if (allowed.company !== undefined) requireEnum(allowed.company, 'company', COMPANIES);
  optionalString(allowed.orderRef, 'orderRef');
  optionalString(allowed.note, 'note');

  const updated = await RequisitionService.update(req.params.id, allowed as Parameters<typeof RequisitionService.update>[1]);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await RequisitionService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
