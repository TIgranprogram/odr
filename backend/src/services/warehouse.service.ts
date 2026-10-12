import { WarehouseMovement, IWarehouseMovement } from '../models/WarehouseMovement';

export const getAll = async (): Promise<IWarehouseMovement[]> => {
  return await WarehouseMovement.find({}).sort({ date: -1 }).exec();
};

export const create = async (data: Partial<IWarehouseMovement>): Promise<IWarehouseMovement> => {
  const movement = new WarehouseMovement(data);
  return await movement.save();
};

export const findById = async (id: string): Promise<IWarehouseMovement | null> => {
  return await WarehouseMovement.findById(id).exec();
};

export const update = async (
  id: string,
  data: Partial<IWarehouseMovement>
): Promise<IWarehouseMovement | null> => {
  return await WarehouseMovement.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
};

/** Возвращает null, если записи нет — контроллер мапит это в 404. */
export const remove = async (id: string): Promise<IWarehouseMovement | null> => {
  return await WarehouseMovement.findByIdAndDelete(id).exec();
};
