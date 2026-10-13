import { Request, Response } from 'express';
import * as DictionaryService from '../services/dictionary.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ensureObject, pickAllowed, requireString } from '../utils/validate';

const DICTIONARY_FIELDS = ['name', 'category', 'value', 'isActive', 'meta'] as const;

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const items = await DictionaryService.getAll();
  res.json(items);
});

export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const items = await DictionaryService.getByCategory(req.params.category);
  res.json(items);
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const { name, category, value, meta } = pickAllowed(body, DICTIONARY_FIELDS);
  requireString(name, 'name');
  requireString(category, 'category');
  requireString(value, 'value');
  const savedItem = await DictionaryService.createItem(name as string, category as string, value as string, meta as Record<string, unknown> | undefined);
  res.status(201).json(savedItem);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, DICTIONARY_FIELDS);
  if (allowed.name !== undefined) requireString(allowed.name, 'name');
  if (allowed.category !== undefined) requireString(allowed.category, 'category');
  if (allowed.value !== undefined) requireString(allowed.value, 'value');

  const updated = await DictionaryService.updateItem(req.params.id, allowed as Parameters<typeof DictionaryService.updateItem>[1]);
  // Без этой проверки несуществующая запись отдавала бы 200 с null
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await DictionaryService.deleteItem(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
