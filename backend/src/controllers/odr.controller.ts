import { Request, Response } from 'express';
import * as OdrService from '../services/odr.service';

export const getReport = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const report = await OdrService.getReport(startDate, endDate);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const report = await OdrService.getReport(startOfMonth, now);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
