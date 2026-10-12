import { Request, Response } from 'express';
import * as DictionaryService from '../services/dictionary.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const items = await DictionaryService.getAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByCategory = async (req: Request, res: Response) => {
  try {
    const items = await DictionaryService.getByCategory(req.params.category);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, category, value, meta } = req.body;
    const savedItem = await DictionaryService.createItem(name, category, value, meta);
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await DictionaryService.updateItem(id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await DictionaryService.deleteItem(id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
