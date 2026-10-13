import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * @interface IStockItem
 * @property {string} name - Наименование ТМЦ
 * @property {string} category - Категория
 * @property {string} unit - Ед. изм.
 * @property {number} initialStock - Начальный остаток
 * @property {number} received - Поступило
 * @property {number} reserved - Забронировано
 * @property {number} writtenOff - Списано
 * @property {number} currentStock - Текущий остаток
 * @property {number} freeStock - Свободный остаток
 * @property {string} status - Статус наличия
 * @property {number} minStock - Мин. остаток
 * @property {number} weight - Вес 1 шт.
 * @property {mongoose.Types.ObjectId} categoryRef - Ссылка на справочник категорий
 * @property {mongoose.Types.ObjectId} unitRef - Ссылка на справочник Ед.изм.
 */
export interface IStockItem extends Document {
  name: string;
  category: string;
  unit: string;
  initialStock: number;
  received: number;
  reserved: number;
  writtenOff: number;
  currentStock: number;
  freeStock: number;
  status: string;
  minStock: number;
  weight: number;
  categoryRef: mongoose.Types.ObjectId;
  unitRef: mongoose.Types.ObjectId;
  /** T-6.1: организация-владелец записи */
  organizationId: string;
}

const StockItemSchema = new Schema<IStockItem>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  initialStock: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  writtenOff: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  freeStock: { type: Number, default: 0 },
  status: { type: String, default: '✅ В норме' },
  minStock: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  categoryRef: { type: Schema.Types.ObjectId, ref: 'Dictionary' },
  unitRef: { type: Schema.Types.ObjectId, ref: 'Dictionary' },
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StockItemSchema.index({ name: 1 });
StockItemSchema.index({ category: 1 });

export const StockItem = mongoose.model<IStockItem>('StockItem', StockItemSchema);
