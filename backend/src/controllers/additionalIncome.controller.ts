import { Request, Response } from 'express';
import * as AdditionalIncomeService from '../services/additionalIncome.service';
import * as AuditService from '../services/audit.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrgId } from '../utils/tenant';
import { ensureObject, optionalString, pickAllowed, requireNumber, requireString } from '../utils/validate';

const INCOME_FIELDS = ['date', 'amount', 'category', 'note'] as const;

const ENTITY = 'additionalIncomes';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await AdditionalIncomeService.getAll(getOrgId(req));
  res.json(items);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await AdditionalIncomeService.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, INCOME_FIELDS);
  requireNumber(allowed.amount, 'amount');
  requireString(allowed.category, 'category');
  optionalString(allowed.note, 'note');

  const saved = await AdditionalIncomeService.create({
    ...allowed,
    organizationId: getOrgId(req),
  } as Parameters<typeof AdditionalIncomeService.create>[0]);
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'CREATE', req, after: saved, fields: INCOME_FIELDS,
  });
  res.status(201).json(saved);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, INCOME_FIELDS);
  if (allowed.amount !== undefined) requireNumber(allowed.amount, 'amount');
  if (allowed.category !== undefined) requireString(allowed.category, 'category');
  optionalString(allowed.note, 'note');

  const before = await AdditionalIncomeService.getById(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });

  const updated = await AdditionalIncomeService.update(req.params.id, allowed as Parameters<typeof AdditionalIncomeService.update>[1]);
  // Без этой проверки несуществующая запись отдавала бы 200 с null
  if (!updated) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'UPDATE', req, before, after: updated, fields: INCOME_FIELDS,
  });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const before = await AdditionalIncomeService.getById(req.params.id);
  const deleted = await AdditionalIncomeService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'DELETE', req, before, fields: INCOME_FIELDS,
  });
  res.json({ message: 'Deleted successfully' });
});
