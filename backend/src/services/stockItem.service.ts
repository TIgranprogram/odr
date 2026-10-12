import mongoose, { Document } from 'mongoose';
import * as DictionaryService from '../services/dictionary.service';
import { StockItem } from '../models/StockItem';

class StockItemService {
  static async getAll() {
    return await StockItem.find({}).sort({ name: 1 }).exec();
  }

  static async create(data: any) {
    // Find refs
    const category = await DictionaryService.getById(data.categoryRef);
    const unit = await DictionaryService.getById(data.unitRef);
    
    const newItem = new StockItem({
      ...data,
      category: category?.value || data.category,
      unit: unit?.value || data.unit
    });
    return await newItem.save();
  }

  static async findById(id: string) {
    return await StockItem.findById(id).exec();
  }

  static async update(id: string, data: any) {
    return await StockItem.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export default StockItemService;
