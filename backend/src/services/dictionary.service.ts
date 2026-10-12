import { Dictionary, IDictionaryItem } from '../models/Dictionary';

/**
 * Справочники. Именованные экспорты — контроллеры подключают сервис
 * через `import * as DictionaryService`, поэтому default-экспорт не используется.
 */

export const getAll = async (): Promise<IDictionaryItem[]> => {
  return await Dictionary.find({}).exec();
};

export const getByCategory = async (category: string): Promise<IDictionaryItem[]> => {
  return await Dictionary.find({ category }).exec();
};

export const getById = async (id: string): Promise<IDictionaryItem | null> => {
  return await Dictionary.findById(id).exec();
};

export const createItem = async (
  name: string,
  category: string,
  value: string,
  meta?: Record<string, unknown>
): Promise<IDictionaryItem> => {
  const item = new Dictionary({ name, category, value, meta });
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
