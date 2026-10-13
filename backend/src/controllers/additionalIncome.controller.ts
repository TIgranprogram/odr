import { Request, Response } from 'express';
import * as AdditionalIncomeService from '../services/additionalIncome.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ensureObject, optionalString, pickAllowed, requireNumber, requireString } from '../utils/validate';

const INCOME_FIELDS = ['date', 'amount', 'category', 'note'] as const;

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const items = await AdditionalIncomeService.getAll();
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

  const saved = await AdditionalIncomeService.create(allowed as Parameters<typeof AdditionalIncomeService.create>[0]);
  res.status(201).json(saved);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, INCOME_FIELDS);
  if (allowed.amount !== undefined) requireNumber(allowed.amount, 'amount');
  if (allowed.category !== undefined) requireString(allowed.category, 'category');
  optionalString(allowed.note, 'note');

  const updated = await AdditionalIncomeService.update(req.params.id, allowed as Parameters<typeof AdditionalIncomeService.update>[1]);
  // Без этой проверки несуществующая запись отдавала бы 200 с null
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await AdditionalIncomeService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
