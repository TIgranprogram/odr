import { Requisition, IRequisition } from '../models/Requisition';

export interface RequisitionFilters {
  category?: string;
  status?: string;
  customer?: string;
  priority?: string;
  /** Текстовый поиск из фронта (поиск по itemName/sku/supplier/note) */
  search?: string;
  [key: string]: unknown;
}

export const getAll = async (filters: RequisitionFilters = {}): Promise<IRequisition[]> => {
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

  return await Requisition.find(query).sort({ date: -1 }).exec();
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
