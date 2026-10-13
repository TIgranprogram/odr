import mongoose, { Schema, Document } from 'mongoose';

/**
 * Номенклатура каталога (импорт `db_spotninyg - products.csv`).
 * @property {string} supplierArticle - Артикул поставщика
 * @property {string} internalSku - Внутренний SKU (используется для связи с заявками)
 * @property {string} category - Категория (верхний уровень)
 * @property {string} subcategory - Подкатегория/тип
 * @property {string} brand - Бренд
 * @property {string} name - Модель/наименование
 * @property {string} size - Параметры/размер
 * @property {string} supplier - Поставщик
 * @property {number} price - Цена
 * @property {string} unit - Ед. изм.
 * @property {string} fullName - Полное наименование
 */
export interface IProduct extends Document {
  supplierArticle: string;
  internalSku: string;
  category: string;
  subcategory: string;
  brand: string;
  name: string;
  size: string;
  supplier: string;
  price: number;
  unit: string;
  fullName: string;
}

const ProductSchema = new Schema<IProduct>({
  supplierArticle: { type: String, default: '' },
  internalSku: { type: String, required: true, unique: true, trim: true },
  category: { type: String, default: '' },
  subcategory: { type: String, default: '' },
  brand: { type: String, default: '' },
  name: { type: String, required: true },
  size: { type: String, default: '' },
  supplier: { type: String, default: '' },
  price: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  fullName: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
