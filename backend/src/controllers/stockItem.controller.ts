import { Request, Response } from 'express';
import * as StockItemService from '../services/stockItem.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const items = await StockItemService.getAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const saved = await StockItemService.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const findById = async (req: Request, res: Response) => {
  try {
    const item = await StockItemService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updated = await StockItemService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
