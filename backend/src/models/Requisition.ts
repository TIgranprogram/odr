import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

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
  /** T-6.1: организация-владелец записи */
  organizationId: string;
}

const RequisitionSchema = new Schema<IRequisition>({
  date: { type: Date, default: Date.now },
  // Фронт пока не присылает category — default, чтобы POST не падал (фронт добавит поле позже)
  category: { type: String, default: 'Прочее' },
  itemName: { type: String, required: true },
  sku: { type: String },
  unit: { type: String },
  quantity: { type: Number, required: true },
  // required: контроллер подставляет автора из JWT (фронт requestedBy не отправляет)
  requestedBy: { type: String, required: true },
  // enum соответствует реальным значениям из CSV (есть «Низко», нет «Низкий»)
  priority: { type: String, enum: ['Срочно', 'Обычный', 'Низко'], default: 'Обычный' },
  status: { type: String, default: '⏳ Ожидает' },
  // Фронт не отправляет company — default, чтобы POST не падал
  company: { type: String, enum: ['СИЮ', 'ССЮ'], default: 'СИЮ' },
  // Фронт может прислать пустую строку, поэтому не required
  customer: { type: String, default: '' },
  orderRef: { type: Schema.Types.ObjectId, ref: 'Order' },
  orderItemRef: { type: Schema.Types.ObjectId, ref: 'Order' },
  supplier: { type: String },
  link: { type: String },
  color: { type: String },
  note: { type: String },
  invoiceRef: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  priceWithVat: { type: Number, required: true },
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RequisitionSchema.index({ date: -1 });
RequisitionSchema.index({ status: 1 });
// T-6.6: фильтр по заказчику — горячее поле в списках заявок
RequisitionSchema.index({ customer: 1 });

export const Requisition = mongoose.model<IRequisition>('Requisition', RequisitionSchema);
