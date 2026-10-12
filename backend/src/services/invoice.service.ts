import mongoose, { Document } from 'mongoose';
import * as DictionaryService from '../services/dictionary.service';
import { Invoice } from '../models/Invoice';

class InvoiceService {
  static async getAll() {
    return await Invoice.find({}).sort({ invoiceDate: -1 }).exec();
  }

  static async create(data: any) {
    const invoice = new Invoice(data);
    return await invoice.save();
  }

  static async findById(id: string) {
    return await Invoice.findById(id).exec();
  }

  static async update(id: string, data: any) {
    return await Invoice.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async linkRequisitions(invoiceId: string, requisitionIds: string[]) {
    // Link multiple requisitions to one invoice
    const result = await Invoice.findByIdAndUpdate(invoiceId, {
      $push: { requisitionRefs: { $each: requisitionIds.map(id => new mongoose.Types.ObjectId(id)) } }
    }, { new: true });
    return result;
  }
}

export default InvoiceService;
