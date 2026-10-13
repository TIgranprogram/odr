import { Dictionary, IDictionaryItem } from '../models/Dictionary';

/**
 * Справочники. Именованные экспорты — контроллеры подключают сервис
 * через `import * as DictionaryService`, поэтому default-экспорт не используется.
 */

export const getAll = async (organizationId?: string): Promise<IDictionaryItem[]> => {
  const filter: Record<string, unknown> = {};
  if (organizationId) filter.organizationId = organizationId;
  return await Dictionary.find(filter).exec();
};

export const getByCategory = async (
  category: string,
  organizationId?: string
): Promise<IDictionaryItem[]> => {
  const filter: Record<string, unknown> = { category };
  if (organizationId) filter.organizationId = organizationId;
  return await Dictionary.find(filter).exec();
};

export const getById = async (id: string): Promise<IDictionaryItem | null> => {
  return await Dictionary.findById(id).exec();
};

export const createItem = async (
  name: string,
  category: string,
  value: string,
  meta?: Record<string, unknown>,
  organizationId?: string
): Promise<IDictionaryItem> => {
  const item = new Dictionary({ name, category, value, meta, organizationId });
  return await item.save();
};

export const updateItem = async (
  id: string,
  updates: Partial<Pick<IDictionaryItem, 'name' | 'category' | 'value' | 'isActive'>> & Record<string, unknown>
): Promise<IDictionaryItem | null> => {
  return await Dictionary.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const deleteItem = async (id: string): Promise<IDictionaryItem | null> => {
  return await Dictionary.findByIdAndDelete(id).exec();
};
