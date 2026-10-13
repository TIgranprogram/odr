import { Requisition } from '../models/Requisition';
import { Invoice } from '../models/Invoice';
import { AdditionalIncome } from '../models/AdditionalIncome';

/**
 * Отчёт ОДР считается агрегацией по существующим коллекциям:
 * доход — сумма оплаченных счетов, расход — сумма заявок, которые уже в работе.
 * Отдельная модель OdrReport удалена: она нигде не использовалась (и в ней был
 * неимпортированный Schema).
 */

/**
 * Статусы заявок, формирующие расход (по ODR_LOGIC.md: «Заказано», «Получено», «Оплачено»).
 * Строки совпадают с frontend/src/app/core/constants.ts и колонкой «Статус» выгрузки
 * «Снабжение - Снабжение.csv»:
 *   «Заказано» → '✅ Заказать'
 *   «Получено» → '☑️ Получено'
 *   «Оплачено» → '💰 Оплачено'
 */
const ODR_EXPENSE_STATUSES = ['✅ Заказать', '💰 Оплачено', '☑️ Получено'];

export interface OdrReport {
  totalIncome: number;
  totalExpense: number;
  net: number;
  range: { startDate: Date; endDate: Date };
}

/**
 * Рассчитывает отчёт за период.
 * Income: сумма Invoice.totalAmount, где isPaid = true, ПЛЮС сумма «Прочих поступлений»
 *   (AdditionalIncome.amount) за период.
 * Expense: сумма Requisition.priceWithVat * quantity, где статус в ODR_EXPENSE_STATUSES
 * и заявка ещё не покрыта счётом (invoiceRef не заполнен) — иначе двойной учёт.
 * organizationId (T-6.1): если передан — все агрегации скоупятся по организации.
 */
export const getReport = async (
  startDate: Date,
  endDate: Date,
  organizationId?: string
): Promise<OdrReport> => {
  const orgMatch = organizationId ? { organizationId } : {};

  const income = await Invoice.aggregate([
    { $match: { invoiceDate: { $gte: startDate, $lte: endDate }, isPaid: true, ...orgMatch } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const additionalIncome = await AdditionalIncome.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate }, ...orgMatch } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const expense = await Requisition.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ODR_EXPENSE_STATUSES },
        $or: [{ invoiceRef: { $exists: false } }, { invoiceRef: null }],
        ...orgMatch,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $multiply: [{ $ifNull: ['$priceWithVat', 0] }, { $ifNull: ['$quantity', 1] }],
          },
        },
      },
    },
  ]);

  const totalIncome =
    (income.length > 0 ? income[0].total : 0) +
    (additionalIncome.length > 0 ? additionalIncome[0].total : 0);
  const totalExpense = expense.length > 0 ? expense[0].total : 0;

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    range: { startDate, endDate },
  };
};
