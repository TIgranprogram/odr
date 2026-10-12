import { Requisition } from '../models/Requisition';
import { Invoice } from '../models/Invoice';

/**
 * Отчёт ОДР считается агрегацией по существующим коллекциям:
 * доход — сумма оплаченных счетов, расход — сумма заявок, которые уже в работе.
 * Отдельная модель OdrReport удалена: она нигде не использовалась (и в ней был
 * неимпортированный Schema).
 */

export interface OdrReport {
  totalIncome: number;
  totalExpense: number;
  net: number;
  range: { startDate: Date; endDate: Date };
}

/**
 * Рассчитывает отчёт за период.
 * Income: сумма Invoice.totalAmount, где isPaid = true.
 * Expense: сумма Requisition.priceWithVat, где статус не '⏳ Ожидает'.
 */
export const getReport = async (startDate: Date, endDate: Date): Promise<OdrReport> => {
  const income = await Invoice.aggregate([
    { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const expense = await Requisition.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate }, status: { $ne: '⏳ Ожидает' } } },
    { $group: { _id: null, total: { $sum: '$priceWithVat' } } },
  ]);

  const totalIncome = income.length > 0 ? income[0].total : 0;
  const totalExpense = expense.length > 0 ? expense[0].total : 0;

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    range: { startDate, endDate },
  };
};
