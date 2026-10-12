import { Order, IOrder } from '../models/Order';

export const getAll = async (): Promise<IOrder[]> => {
  return await Order.find({}).sort({ orderDate: -1 }).exec();
};

export const create = async (data: Partial<IOrder>): Promise<IOrder> => {
  const order = new Order(data);
  return await order.save();
};

export const findById = async (id: string): Promise<IOrder | null> => {
  return await Order.findById(id).exec();
};

export const update = async (id: string, data: Partial<IOrder>): Promise<IOrder | null> => {
  return await Order.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const remove = async (id: string): Promise<IOrder | null> => {
  return await Order.findByIdAndDelete(id).exec();
};
