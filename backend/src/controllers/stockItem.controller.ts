import { Request, Response } from 'express';
import * as StockItemService from '../services/stockItem.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const items = await StockItemService.getAll();
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const saved = await StockItemService.create(req.body);
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await StockItemService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const updated = await StockItemService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await StockItemService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
