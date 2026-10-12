import { Request, Response } from 'express';
import * as OdrService from '../services/odr.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = new Date(String(start));
  const endDate = new Date(String(end));

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Query params "start" and "end" must be valid dates' });
  }

  const report = await OdrService.getReport(startDate, endDate);
  res.json(report);
});

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const report = await OdrService.getReport(startOfMonth, now);
  res.json(report);
});
