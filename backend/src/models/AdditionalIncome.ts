import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * «Прочие поступления» (см. docs/ODR_LOGIC.md): доход, не связанный со счётом
 * (Invoice), вводится вручную с выбором категории и учитывается в ОДР.
 *
 * @property {Date} date - Дата поступления (по ней отчёт фильтрует период)
 * @property {number} amount - Сумма поступления
 * @property {string} category - Категория (напр. «Услуги», «Возврат»)
 * @property {string} note - Примечание (необязательно)
 */
export interface IAdditionalIncome extends Document {
  date: Date;
  amount: number;
  category: string;
  note?: string;
  /** T-6.1: организация-владелец записи */
  organizationId: string;
}

const AdditionalIncomeSchema = new Schema<IAdditionalIncome>({
  date: { type: Date, default: Date.now, required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  note: { type: String, trim: true },
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AdditionalIncomeSchema.index({ date: -1 });

export const AdditionalIncome = mongoose.model<IAdditionalIncome>('AdditionalIncome', AdditionalIncomeSchema);
