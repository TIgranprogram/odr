import {
  AdditionalIncome,
  IAdditionalIncome,
} from '../models/AdditionalIncome';

/**
 * Сервис «Прочих поступлений». Именованные экспорты — контроллер подключает
 * сервис через `import * as AdditionalIncomeService`.
 */

/** T-6.1: список скоупится по организации (необязательный параметр). */
export const getAll = async (organizationId?: string): Promise<IAdditionalIncome[]> => {
  const filter: Record<string, unknown> = {};
  if (organizationId) filter.organizationId = organizationId;
  return await AdditionalIncome.find(filter).sort({ date: -1 }).exec();
};

export const getById = async (id: string): Promise<IAdditionalIncome | null> => {
  return await AdditionalIncome.findById(id).exec();
};

export const create = async (
  data: Pick<IAdditionalIncome, 'amount' | 'category'> & Partial<Pick<IAdditionalIncome, 'date' | 'note'>>
): Promise<IAdditionalIncome> => {
  const item = new AdditionalIncome(data);
  return await item.save();
};

export const update = async (
  id: string,
  updates: Partial<Pick<IAdditionalIncome, 'date' | 'amount' | 'category' | 'note'>>
): Promise<IAdditionalIncome | null> => {
  return await AdditionalIncome.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const remove = async (id: string): Promise<IAdditionalIncome | null> => {
  return await AdditionalIncome.findByIdAndDelete(id).exec();
};

/** Сумма поступлений за период — для учёта в totalIncome отчёта ОДР. */
export const sumForPeriod = async (startDate: Date, endDate: Date): Promise<number> => {
  const result = await AdditionalIncome.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};
