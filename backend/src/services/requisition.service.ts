import mongoose, { Document } from 'mongoose';
import * as DictionaryService from '../services/dictionary.service';
import { Requisition } from '../models/Requisition';

class RequisitionService {
  static async getAll(filters: any = {}) {
    const query: any = {};
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.customer) query.customer = filters.customer;
    if (filters.priority) query.priority = filters.priority;

    return await Requisition.find(query).sort({ date: -1 }).exec();
  }

  static async create(data: any) {
    // Validate and save
    const requisition = new Requisition(data);
    return await requisition.save();
  }

  static async findById(id: string) {
    return await Requisition.findById(id).exec();
  }

  static async update(id: string, data: any) {
    return await Requisition.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async linkToInvoice(requisitionId: string, invoiceId: string) {
    return await Requisition.findByIdAndUpdate(requisitionId, { invoiceRef: invoiceId }, { new: true });
  }
}

export default RequisitionService;
