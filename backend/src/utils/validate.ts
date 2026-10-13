/**
 * Лёгкая валидация входных данных без class-validator/reflect-metadata:
 * явные проверки, возвращающие понятную 400-ошибку.
 */

export class ValidationError extends Error {}

export const ensureObject = (body: unknown): Record<string, unknown> => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }
  return body as Record<string, unknown>;
};

export const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`"${field}" is required and must be a non-empty string`);
  }
  return value.trim();
};

export const optionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new ValidationError(`"${field}" must be a string`);
  return value.trim();
};

export const requireNumber = (value: unknown, field: string): number => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || Number.isNaN(n)) {
    throw new ValidationError(`"${field}" is required and must be a number`);
  }
  return n;
};

export const optionalNumber = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return requireNumber(value, field);
};

export const requireDate = (value: unknown, field: string): Date => {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError(`"${field}" must be a valid date`);
  }
  return d;
};

export const requireEnum = <T extends string>(value: unknown, field: string, allowed: readonly T[]): T => {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ValidationError(`"${field}" must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
};

export const requireArray = (value: unknown, field: string): unknown[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`"${field}" must be a non-empty array`);
  }
  return value;
};

/**
 * Оставляет только разрешённые поля тела (защита от сохранения произвольных полей).
 * Поля со значением undefined отбрасываются.
 */
export const pickAllowed = <T extends string>(body: Record<string, unknown>, allowed: readonly T[]): Partial<Record<T, unknown>> => {
  const out: Partial<Record<T, unknown>> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};
