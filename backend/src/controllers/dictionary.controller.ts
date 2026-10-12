import { Request, Response } from 'express';
import * as DictionaryService from '../services/dictionary.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const items = await DictionaryService.getAll();
  res.json(items);
});

export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const items = await DictionaryService.getByCategory(req.params.category);
  res.json(items);
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const { name, category, value, meta } = req.body;
  const savedItem = await DictionaryService.createItem(name, category, value, meta);
  res.status(201).json(savedItem);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const updated = await DictionaryService.updateItem(req.params.id, req.body);
  // Без этой проверки несуществующая запись отдавала бы 200 с null
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await DictionaryService.deleteItem(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
