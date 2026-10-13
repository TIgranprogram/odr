import { StockItem, IStockItem } from '../models/StockItem';
import * as DictionaryService from './dictionary.service';

/** T-6.1: список скоупится по организации (необязательный параметр). */
export const getAll = async (organizationId?: string): Promise<IStockItem[]> => {
  const filter: Record<string, unknown> = {};
  if (organizationId) filter.organizationId = organizationId;
  return await StockItem.find(filter).sort({ name: 1 }).exec();
};

export const create = async (data: Partial<IStockItem> & { categoryRef?: unknown; unitRef?: unknown }): Promise<IStockItem> => {
  // Если пришли ссылки на справочник — подставляем канонические значения,
  // иначе берём то, что прислал клиент (category/unit).
  const category = data.categoryRef
    ? await DictionaryService.getById(String(data.categoryRef))
    : null;
  const unit = data.unitRef ? await DictionaryService.getById(String(data.unitRef)) : null;

  const newItem = new StockItem({
    ...data,
    category: category?.value || data.category,
    unit: unit?.value || data.unit,
  });
  return await newItem.save();
};

export const findById = async (id: string): Promise<IStockItem | null> => {
  return await StockItem.findById(id).exec();
};

export const update = async (id: string, data: Partial<IStockItem>): Promise<IStockItem | null> => {
  return await StockItem.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const remove = async (id: string): Promise<IStockItem | null> => {
  return await StockItem.findByIdAndDelete(id).exec();
};
