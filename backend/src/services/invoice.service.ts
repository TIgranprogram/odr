import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../models/Invoice';

export const getAll = async (): Promise<IInvoice[]> => {
  return await Invoice.find({}).sort({ invoiceDate: -1 }).exec();
};

export const create = async (data: Partial<IInvoice>): Promise<IInvoice> => {
  const invoice = new Invoice(data);
  return await invoice.save();
};

export const findById = async (id: string): Promise<IInvoice | null> => {
  return await Invoice.findById(id).exec();
};

export const update = async (id: string, data: Partial<IInvoice>): Promise<IInvoice | null> => {
  return await Invoice.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const remove = async (id: string): Promise<IInvoice | null> => {
  return await Invoice.findByIdAndDelete(id).exec();
};

/** Привязывает несколько заявок к одному счёту. */
export const linkRequisitions = async (
  invoiceId: string,
  requisitionIds: string[]
): Promise<IInvoice | null> => {
  return await Invoice.findByIdAndUpdate(
    invoiceId,
    {
      $push: {
        requisitionRefs: { $each: requisitionIds.map(id => new mongoose.Types.ObjectId(id)) },
      },
    },
    { new: true, runValidators: true }
  ).exec();
};
