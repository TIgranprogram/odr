import mongoose, { Document } from 'mongoose';
import * as DictionaryService from '../services/dictionary.service';
import { WarehouseMovement } from '../models/WarehouseMovement';

class WarehouseService {
  static async getAll() {
    return await WarehouseMovement.find({}).sort({ date: -1 }).exec();
  }

  static async create(data: any) {
    const movement = new WarehouseMovement(data);
    return await movement.save();
  }

  static async findById(id: string) {
    return await WarehouseMovement.findById(id).exec();
  }

  static async update(id: string, data: any) {
    return await WarehouseMovement.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export default WarehouseService;
