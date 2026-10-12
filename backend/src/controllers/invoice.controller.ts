import { Request, Response } from 'express';
import * as InvoiceService from '../services/invoice.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const items = await InvoiceService.getAll();
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const saved = await InvoiceService.create(req.body);
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await InvoiceService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const updated = await InvoiceService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await InvoiceService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
