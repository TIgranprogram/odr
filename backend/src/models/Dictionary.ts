import mongoose, { Schema, Document } from 'mongoose';

/**
 * @interface IDictionaryItem
 * @property {string} name - Наименование
 * @property {string} category - Категория (например, Поставщик, Категория товара)
 * @property {string} value - Значение (напр. "ООО Кубаньподшипник")
 * @property {boolean} isActive - Активность
 * @property {string} [meta] - Дополнительные данные в формате JSON
 */
export interface IDictionaryItem extends Document {
  name: string;
  category: string;
  value: string;
  isActive: boolean;
  meta?: Record<string, any>;
}

const DictionarySchema = new Schema<IDictionaryItem>({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }, // "Suppliers", "Categories", "Units", "Statuses", "Priorities"
  value: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  meta: { type: Object }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы для быстрого поиска
DictionarySchema.index({ category: 1, value: 1 });

export const Dictionary = mongoose.model<IDictionaryItem>('Dictionary', DictionarySchema);
