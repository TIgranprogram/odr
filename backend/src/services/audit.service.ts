import { Request } from 'express';
import { Types } from 'mongoose';
import { AuditLog, AuditAction, IAuditChange, IAuditLog } from '../models/AuditLog';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * T-6.3: журнал аудита. logEntityAction не бросает исключений — ошибка записи
 * аудита не должна ломать основную операцию (громкое сообщение в лог).
 */

export interface AuditFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  organizationId?: string;
  page?: number | string;
  limit?: number | string;
}

export interface PagedAuditLogs {
  items: IAuditLog[];
  total: number;
  page: number;
  limit: number;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

const parseDate = (value: string | Date | undefined): Date | undefined => {
  if (value === undefined || value === '') return undefined;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Собирает Mongo-фильтр из параметров запроса. */
function buildQuery(filters: AuditFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (filters.organizationId) query.organizationId = filters.organizationId;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.action) query.action = filters.action;

  const start = parseDate(filters.startDate);
  const end = parseDate(filters.endDate);
  if (start || end) {
    query.createdAt = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) };
  }
  return query;
}

export const getPaged = async (filters: AuditFilters = {}): Promise<PagedAuditLogs> => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || DEFAULT_LIMIT));
  const query = buildQuery(filters);

  const [items, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    AuditLog.countDocuments(query).exec(),
  ]);

  return { items, total, page, limit };
};

/** Shallow-diff: поля, значения которых отличаются (сравнение через JSON). */
export const shallowDiff = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[]
): IAuditChange[] => {
  const changes: IAuditChange[] = [];
  for (const field of fields) {
    const b = before[field];
    const a = after[field];
    if (JSON.stringify(b ?? null) !== JSON.stringify(a ?? null)) {
      changes.push({ field, before: b ?? null, after: a ?? null });
    }
  }
  return changes;
};

const toPlain = (doc: unknown): Record<string, unknown> | null => {
  if (!doc || typeof doc !== 'object') return null;
  if (typeof (doc as { toObject?: unknown }).toObject === 'function') {
    return (doc as { toObject: () => Record<string, unknown> }).toObject();
  }
  return doc as Record<string, unknown>;
};

export interface LogEntityActionInput {
  /** Имя сущности по роуту: 'requisitions', 'invoices', 'users', … */
  entityType: string;
  action: AuditAction;
  /** Запрос — откуда берутся userId/username/organizationId */
  req?: Request;
  /** Состояние до операции (для UPDATE/DELETE) */
  before?: unknown;
  /** Состояние после операции (для CREATE/UPDATE) */
  after?: unknown;
  /** Поля, участвующие в diff (без паролей и служебных) */
  fields?: readonly string[];
}

/** Записывает запись аудита; никогда не бросает исключений. */
export const logEntityAction = async (input: LogEntityActionInput): Promise<void> => {
  try {
    const beforeObj = toPlain(input.before);
    const afterObj = toPlain(input.after);
    const fields = input.fields ?? [];

    let changes: IAuditChange[] | undefined;
    if (input.action === 'UPDATE') {
      if (!beforeObj || !afterObj) return;
      changes = shallowDiff(beforeObj, afterObj, fields);
      if (changes.length === 0) return; // фактических изменений нет — не шумим
    } else if (input.action === 'DELETE') {
      if (!beforeObj) return;
      changes = fields
        .filter((f) => beforeObj[f] !== undefined)
        .map((f) => ({ field: f, before: beforeObj[f] ?? null }));
    }

    const source = afterObj ?? beforeObj;
    await AuditLog.create({
      entityType: input.entityType,
      entityId: source?._id,
      action: input.action,
      userId: input.req?.user?.id,
      username: input.req?.user?.sub,
      changes,
      organizationId:
        input.req?.user?.organizationId ||
        (typeof source?.organizationId === 'string' ? source.organizationId : undefined) ||
        DEFAULT_ORGANIZATION_ID,
    });
  } catch (err) {
    console.error('Audit log write failed:', err instanceof Error ? err.message : err);
  }
};

/** Проверка, что entityId — валидный ObjectId (для фильтра GET /api/audit-logs). */
export const isValidEntityId = (value: string): boolean => Types.ObjectId.isValid(value);
