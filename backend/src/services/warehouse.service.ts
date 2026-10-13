import { WarehouseMovement, IWarehouseMovement } from '../models/WarehouseMovement';

/** T-6.1: список скоупится по организации (необязательный параметр). */
export const getAll = async (organizationId?: string): Promise<IWarehouseMovement[]> => {
  const filter: Record<string, unknown> = {};
  if (organizationId) filter.organizationId = organizationId;
  return await WarehouseMovement.find(filter).sort({ date: -1 }).exec();
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
