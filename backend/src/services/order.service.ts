import mongoose, { Document } from 'mongoose';
import * as DictionaryService from '../services/dictionary.service';
import { Order } from '../models/Order';

class OrderService {
  static async getAll() {
    return await Order.find({}).sort({ orderDate: -1 }).exec();
  }

  static async create(data: any) {
    const order = new Order(data);
    return await order.save();
  }

  static async findById(id: string) {
    return await Order.findById(id).exec();
  }

  static async update(id: string, data: any) {
    return await Order.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export default OrderService;
