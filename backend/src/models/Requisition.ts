import mongoose, { Schema, Document } from 'mongoose';
import * as DictionaryService from '../services/dictionary.service';

/**
 * @interface IRequisition
 * @property {Date} date - Дата заявки
 * @property {string} category - Категория товара
 * @property {string} itemName - Наименование позиции
 * @property {string} sku - Артикул
 * @property {string} unit - Единица измерения
 * @property {number} quantity - Количество
 * @property {string} requestedBy - Кто подал заявку (Username)
 * @property {string} priority - Приоритет ('Срочно', 'Обычный', 'Низко')
 * @property {string} status - Статус заявки
 * @property {string} company - Наша компания (СИЮ, ССЮ)
 * @property {string} customer - Заказчик / Объект
 * @property {mongoose.Types.ObjectId} orderRef - Ссылка на Заказ
 * @property {mongoose.Types.ObjectId} orderItemRef - Ссылка на конкретный пункт заказа
 * @property {string} supplier - Поставщик
 * @property {string} link - Ссылка на товар
 * @property {string} color - Цвет
 * @property {string} note - Примечание
 * @property {mongoose.Types.ObjectId} invoiceRef - Ссылка на документ «Счет»
 * @property {number} priceWithVat - Цена с НДС
 */
export interface IRequisition extends Document {
  date: Date;
  category: string;
  itemName: string;
  sku: string;
  unit: string;
  quantity: number;
  requestedBy: string;
  priority: string;
  status: string;
  company: string;
  customer: string;
  orderRef?: mongoose.Types.ObjectId;
  orderItemRef?: mongoose.Types.ObjectId;
  supplier: string;
  link: string;
  color: string;
  note: string;
  invoiceRef?: mongoose.Types.ObjectId;
  priceWithVat: number;
}

const RequisitionSchema = new Schema<IRequisition>({
  date: { type: Date, default: Date.now },
  category: { type: String, required: true },
  itemName: { type: String, required: true },
  sku: { type: String },
  unit: { type: String },
  quantity: { type: Number, required: true },
  requestedBy: { type: String, required: true },
  priority: { type: String, enum: ['Срочно', 'Обычный', 'Низко'], default: 'Обычный' },
  status: { type: String, default: '⏳ Ожидает' },
  company: { type: String, enum: ['СИЮ', 'ССЮ'], required: true },
  customer: { type: String, required: true },
  orderRef: { type: Schema.Types.ObjectId, ref: 'Order' },
  orderItemRef: { type: Schema.Types.ObjectId, ref: 'Order' },
  supplier: { type: String },
  link: { type: String },
  color: { type: String },
  note: { type: String },
  invoiceRef: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  priceWithVat: { type: Number, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RequisitionSchema.index({ date: -1 });
RequisitionSchema.index({ status: 1 });

export const Requisition = mongoose.model<IRequisition>('Requisition', RequisitionSchema);
