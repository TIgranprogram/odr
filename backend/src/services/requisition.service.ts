import { Requisition, IRequisition } from '../models/Requisition';

export interface RequisitionFilters {
  category?: string;
  status?: string;
  customer?: string;
  priority?: string;
  /** Текстовый поиск из фронта (поиск по itemName/sku/supplier/note) */
  search?: string;
  /** Серверная пагинация (T-4.3) */
  page?: number | string;
  limit?: number | string;
  sort?: string;
  [key: string]: unknown;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

/** Собирает Mongo-фильтр из query-параметров. */
function buildQuery(filters: RequisitionFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (filters.customer) query.customer = filters.customer;
  if (filters.priority) query.priority = filters.priority;

  // Фронт шлёт ?search=... — раньше фильтр просто игнорировался
  if (filters.search) {
    const escaped = String(filters.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [
      { itemName: regex },
      { sku: regex },
      { supplier: regex },
      { note: regex },
    ];
  }
  return query;
}

/** sort=field:asc|desc (напр. date:desc). Неизвестное поле игнорируется. */
function buildSort(sort?: string): Record<string, 1 | -1> {
  const allowed = new Set(['date', 'itemName', 'quantity', 'priceWithVat', 'status', 'customer']);
  if (!sort) return { date: -1 };
  const [field, dir] = String(sort).split(':');
  if (!allowed.has(field)) return { date: -1 };
  return { [field]: dir === 'asc' ? 1 : -1 };
}

export const getAll = async (filters: RequisitionFilters = {}): Promise<IRequisition[]> => {
  return await Requisition.find(buildQuery(filters)).sort(buildSort(filters.sort)).exec();
};

export const getPaged = async (
  filters: RequisitionFilters = {}
): Promise<PagedResult<IRequisition>> => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || DEFAULT_LIMIT));
  const query = buildQuery(filters);

  const [items, total] = await Promise.all([
    Requisition.find(query)
      .sort(buildSort(filters.sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    Requisition.countDocuments(query).exec(),
  ]);

  return { items, total, page, limit };
};

export const create = async (data: Partial<IRequisition>): Promise<IRequisition> => {
  const requisition = new Requisition(data);
  return await requisition.save();
};

export const findById = async (id: string): Promise<IRequisition | null> => {
  return await Requisition.findById(id).exec();
};

export const update = async (id: string, data: Partial<IRequisition>): Promise<IRequisition | null> => {
  return await Requisition.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const remove = async (id: string): Promise<IRequisition | null> => {
  return await Requisition.findByIdAndDelete(id).exec();
};

export const linkToInvoice = async (
  requisitionId: string,
  invoiceId: string
): Promise<IRequisition | null> => {
  return await Requisition.findByIdAndUpdate(
    requisitionId,
    { invoiceRef: invoiceId },
    { new: true, runValidators: true }
  ).exec();
};
