import mongoose, { Document } from 'mongoose';
import { Requisition } from '../models/Requisition';
import { Invoice } from '../models/Invoice';
import { Order } from '../models/Order';

/**
 * @interface IOdrReport
 * @property {Date} date
 * @property {number} income
 * @property {number} expense
 * @property {string} category
 * @property {string} customer
 * @property {string} note
 */
export interface IOdrReport extends Document {
  date: Date;
  income: number;
  expense: number;
  category: string;
  customer: string;
  note: string;
}

const OdrReportSchema = new Schema<IOdrReport>({
  date: { type: Date, default: Date.now },
  income: { type: Number, default: 0 },
  expense: { type: Number, default: 0 },
  category: { type: String },
  customer: { type: String },
  note: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const OdrReport = mongoose.model<IOdrReport>('OdrReport', OdrReportSchema);

class OdrService {
  /**
   * Calculates the report for a specific date range.
   * Income: Sum of Invoice.totalAmount where isPaid = true
   * Expense: Sum of Requisition.priceWithVat where status != 'Ожидает'
   */
  static async getReport(startDate: Date, endDate: Date) {
    const income = await Invoice.aggregate([
      { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const expense = await Requisition.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, status: { $ne: '⏳ Ожидает' } } },
      { $group: { _id: null, total: { $sum: "$priceWithVat" } } }
    ]);

    return {
      totalIncome: income.length > 0 ? income[0].total : 0,
      totalExpense: expense.length > 0 ? expense[0].total : 0,
      net: (income.length > 0 ? income[0].total : 0) - (expense.length > 0 ? expense[0].total : 0),
      range: { startDate, endDate }
    };
  }
}

export default OdrService;
