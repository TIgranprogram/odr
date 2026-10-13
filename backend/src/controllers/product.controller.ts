import { Request, Response } from 'express';
import * as ProductService from '../services/product.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ensureObject, pickAllowed, requireNumber, requireString } from '../utils/validate';

const PRODUCT_FIELDS = [
  'supplierArticle', 'internalSku', 'category', 'subcategory', 'brand',
  'name', 'size', 'supplier', 'price', 'unit', 'fullName',
] as const;

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { category, supplier, search } = req.query;
  const items = await ProductService.getAll({
    category: category ? String(category) : undefined,
    supplier: supplier ? String(supplier) : undefined,
    search: search ? String(search) : undefined,
  });
  res.json(items);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await ProductService.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const getBySku = asyncHandler(async (req: Request, res: Response) => {
  const item = await ProductService.getBySku(req.params.sku);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, PRODUCT_FIELDS);
  requireString(allowed.internalSku, 'internalSku');
  requireString(allowed.name, 'name');
  if (allowed.price !== undefined) requireNumber(allowed.price, 'price');

  const saved = await ProductService.create(allowed as Parameters<typeof ProductService.create>[0]);
  res.status(201).json(saved);
});
