import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * @interface IInvoice
 * @property {string} invoiceNumber - № Счета
 * @property {Date} invoiceDate - Дата счета
 * @property {string} supplier - Поставщик
 * @property {string} invoiceType - Тип счета
 * @property {string} company - Наша компания
 * @property {Array<{itemName: string, quantity: number, price: number, sum: number}>} items - Позиции счета
 * @property {number} totalAmount - Итоговая сумма
 * @property {boolean} isPaid - Оплачено ли
 * @property {string} note - Примечание
 */
export interface IInvoice extends Document {
  invoiceNumber: string;
  invoiceDate: Date;
  supplier: string;
  invoiceType: string;
  company: string;
  items: Array<{ itemName: string, quantity: number, price: number, sum: number }>;
  totalAmount: number;
  isPaid: boolean;
  note: string;
  /** T-6.1: организация-владелец записи */
  organizationId: string;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  supplier: { type: String, required: true },
  invoiceType: { type: String, required: true },
  company: { type: String, enum: ['СИЮ', 'ССЮ'], required: true },
  items: [
    {
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      sum: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  note: { type: String },
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

InvoiceSchema.index({ invoiceDate: -1 });
InvoiceSchema.index({ isPaid: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
