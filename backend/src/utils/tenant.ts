import { Request } from 'express';

/**
 * T-6.1 Tenant isolation. Организация по умолчанию: в single-tenant деплое
 * все записи и токены относятся к ней, поэтому поведение API не меняется.
 */
export const DEFAULT_ORGANIZATION_ID = 'default-org';

/**
 * Организация текущего запроса: из JWT (см. auth.middleware — старые токены
 * без organizationId получают fallback на 'default-org').
 */
export const getOrgId = (req: Request): string =>
  req.user?.organizationId || DEFAULT_ORGANIZATION_ID;
