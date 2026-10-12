import { Request, Response } from 'express';
import * as RequisitionService from '../services/requisition.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await RequisitionService.getAll(req.query);
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  // Фронт НЕ присылает requestedBy — подставляем автора из токена (поле required в модели)
  const requestedBy = req.user?.fullName || req.user?.sub || req.body.requestedBy;
  const saved = await RequisitionService.create({ ...req.body, requestedBy });
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await RequisitionService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const updated = await RequisitionService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await RequisitionService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});
