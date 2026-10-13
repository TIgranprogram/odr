import { Request, Response } from 'express';
import * as AuditService from '../services/audit.service';
import { asyncHandler } from '../utils/asyncHandler';
import { requireEnum, ValidationError } from '../utils/validate';

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;

/** GET /api/audit-logs — только ADMIN (roleMiddleware на уровне app.ts). */
export const getPaged = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId, action, startDate, endDate, page, limit } = req.query;

  if (action !== undefined) requireEnum(action, 'action', ACTIONS);
  if (entityId !== undefined && !AuditService.isValidEntityId(String(entityId))) {
    throw new ValidationError('"entityId" must be a valid MongoDB ObjectId');
  }

  const result = await AuditService.getPaged({
    entityType: entityType !== undefined ? String(entityType) : undefined,
    entityId: entityId !== undefined ? String(entityId) : undefined,
    action: action !== undefined ? String(action) : undefined,
    startDate: startDate !== undefined ? String(startDate) : undefined,
    endDate: endDate !== undefined ? String(endDate) : undefined,
    organizationId: req.user?.organizationId,
    page: page !== undefined ? Number(page) : undefined,
    limit: limit !== undefined ? Number(limit) : undefined,
  });
  res.json(result);
});
