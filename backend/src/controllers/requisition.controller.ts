import { Request, Response } from 'express';
import * as RequisitionService from '../services/requisition.service';
import * as AuditService from '../services/audit.service';
import * as SnapshotService from '../services/snapshot.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrgId } from '../utils/tenant';
import {
  ensureObject,
  optionalString,
  pickAllowed,
  requireEnum,
  requireNumber,
  requireString,
} from '../utils/validate';

const REQUISITION_FIELDS = [
  'date', 'category', 'itemName', 'sku', 'unit', 'quantity', 'requestedBy', 'priority',
  'status', 'company', 'customer', 'orderRef', 'orderItemRef', 'supplier', 'link', 'color',
  'note', 'invoiceRef', 'priceWithVat',
] as const;

const PRIORITIES = ['Срочно', 'Обычный', 'Низко'] as const;
const COMPANIES = ['СИЮ', 'ССЮ'] as const;

const ENTITY = 'requisitions';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await RequisitionService.getAll({ ...req.query, organizationId: getOrgId(req) });
  res.json(items);
});

export const getPaged = asyncHandler(async (req: Request, res: Response) => {
  const result = await RequisitionService.getPaged({ ...req.query, organizationId: getOrgId(req) });
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, REQUISITION_FIELDS);

  // Обязательные поля (остальные — со значениями по умолчанию модели).
  requireString(allowed.itemName, 'itemName');
  requireNumber(allowed.quantity, 'quantity');
  requireNumber(allowed.priceWithVat, 'priceWithVat');
  if (allowed.priority !== undefined) requireEnum(allowed.priority, 'priority', PRIORITIES);
  if (allowed.company !== undefined) requireEnum(allowed.company, 'company', COMPANIES);
  optionalString(allowed.status, 'status');

  // Фронт НЕ присылает requestedBy — подставляем автора из токена (поле required в модели)
  const requestedBy = req.user?.fullName || req.user?.sub || optionalString(allowed.requestedBy, 'requestedBy') || '';

  const saved = await RequisitionService.create({
    ...allowed,
    requestedBy,
    organizationId: getOrgId(req),
  } as Parameters<typeof RequisitionService.create>[0]);
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'CREATE', req, after: saved, fields: REQUISITION_FIELDS,
  });
  res.status(201).json(saved);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const item = await RequisitionService.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = ensureObject(req.body);
  const allowed = pickAllowed(body, REQUISITION_FIELDS);

  // Валидируем только переданные поля (partial update).
  if (allowed.itemName !== undefined) requireString(allowed.itemName, 'itemName');
  if (allowed.quantity !== undefined) requireNumber(allowed.quantity, 'quantity');
  if (allowed.priceWithVat !== undefined) requireNumber(allowed.priceWithVat, 'priceWithVat');
  if (allowed.priority !== undefined) requireEnum(allowed.priority, 'priority', PRIORITIES);
  if (allowed.company !== undefined) requireEnum(allowed.company, 'company', COMPANIES);
  optionalString(allowed.orderRef, 'orderRef');
  optionalString(allowed.note, 'note');

  // Состояние до операции — для аудита (diff) и снимка при смене статуса (T-6.2/T-6.3)
  const before = await RequisitionService.findById(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });

  const updated = await RequisitionService.update(req.params.id, allowed as Parameters<typeof RequisitionService.update>[1]);
  if (!updated) return res.status(404).json({ error: 'Not found' });

  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'UPDATE', req, before, after: updated, fields: REQUISITION_FIELDS,
  });

  // T-6.2: переход статуса → неизменяемый снимок заявки
  const statusChanged = allowed.status !== undefined && String(updated.status) !== String(before.status);
  if (statusChanged) {
    await SnapshotService.captureForRequisition(updated, {
      previousStatus: before.status,
      capturedBy: req.user?.sub,
      organizationId: getOrgId(req),
    });
  }

  res.json(updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const before = await RequisitionService.findById(req.params.id);
  const deleted = await RequisitionService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  await AuditService.logEntityAction({
    entityType: ENTITY, action: 'DELETE', req, before, fields: REQUISITION_FIELDS,
  });
  res.json({ message: 'Deleted successfully' });
});

/** T-6.2: список неизменяемых снимков заявки (новые сверху). */
export const getSnapshots = asyncHandler(async (req: Request, res: Response) => {
  const snapshots = await SnapshotService.listByRequisition(req.params.id);
  res.json(snapshots);
});
