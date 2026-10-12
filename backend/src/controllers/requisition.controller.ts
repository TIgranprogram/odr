import { Request, Response } from 'express';
import * as RequisitionService from '../services/requisition.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const items = await RequisitionService.getAll(req.query);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const saved = await RequisitionService.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const findById = async (req: Request, res: Response) => {
  try {
    const item = await RequisitionService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updated = await RequisitionService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
