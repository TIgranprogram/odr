import { Request, Response } from 'express';
import * as InvoiceService from '../services/invoice.service';
import * as AuditService from '../services/audit.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrgId } from '../utils/tenant';
import {
  ensureObject,
  pickAllowed,
  requireEnum,
  requireNumber,
  requireString,
} from '../utils/validate';

const INVOICE_FIELDS = [
  'invoiceNumber', 'invoiceDate', 'supplier', 'invoiceType', 'company',
  'items', 'totalAmount', 'isPaid', 'note',
] as const;

const COMPANIES = ['СИЮ', 'ССЮ'] as const;

const ENTITY = 'invoices';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await InvoiceService.getAll(getOrgId(req));
  res.json(items);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, INVOICE_FIELDS);

  requireString(allowed.invoiceNumber, 'invoiceNumber');
  requireString(allowed.supplier, 'supplier');
  requireString(allowed.invoiceType, 'invoiceType');
  requireEnum(allowed.company, 'company', COMPANIES);
  requireNumber(allowed.totalAmount, 'totalAmount');

  const saved = await InvoiceService.create({
    ...allowed,
    organizationId: getOrgId(req),
  } as Parameters<typeof InvoiceService.create>[0]);
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'CREATE', req, after: saved, fields: INVOICE_FIELDS,
  });
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await InvoiceService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, INVOICE_FIELDS);

  if (allowed.invoiceNumber !== undefined) requireString(allowed.invoiceNumber, 'invoiceNumber');
  if (allowed.supplier !== undefined) requireString(allowed.supplier, 'supplier');
  if (allowed.invoiceType !== undefined) requireString(allowed.invoiceType, 'invoiceType');
  if (allowed.company !== undefined) requireEnum(allowed.company, 'company', COMPANIES);
  if (allowed.totalAmount !== undefined) requireNumber(allowed.totalAmount, 'totalAmount');

  const before = await InvoiceService.findById(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });

  const updated = await InvoiceService.update(req.params.id, allowed as Parameters<typeof InvoiceService.update>[1]);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'UPDATE', req, before, after: updated, fields: INVOICE_FIELDS,
  });
  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const before = await InvoiceService.findById(req.params.id);
  const deleted = await InvoiceService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'DELETE', req, before, fields: INVOICE_FIELDS,
  });
  res.json({ message: 'Deleted successfully' });
});
