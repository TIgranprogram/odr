import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * @interface IOrder
 * @property {string} orderNumber - № Заказа
 * @property {string} customer - Заказчик / Объект
 * @property {string} status - Статус заказа
 * @property {Array<{itemTitle: string, quantity: number, unit: string, price: number, total: number}>} items - Пункты заказа
 * @property {number} totalAmount - Общая сумма заказа
 * @property {Date} orderDate - Дата заказа
 * @property {string} note - Примечание
 */
export interface IOrder extends Document {
  orderNumber: string;
  customer: string;
  status: string;
  items: Array<{ itemTitle: string, quantity: number, unit: string, price: number, total: number }>;
  totalAmount: number;
  orderDate: Date;
  note: string;
  /** T-6.1: организация-владелец записи */
  organizationId: string;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  status: { type: String, default: 'В работе' },
  items: [
    {
      itemTitle: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String },
      price: { type: Number, required: true },
      total: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  note: { type: String },
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ customer: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
