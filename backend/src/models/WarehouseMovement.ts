import mongoose, { Schema, Document } from 'mongoose';

/**
 * @interface IWarehouseMovement
 * @property {Date} date - Дата движения
 * @property {string} type - Тип движения ('INCOME' (Приход), 'OUTCOME' (Списание/Расход))
 * @property {string} itemName - Наименование товара
 * @property {number} quantity - Количество
 * @property {string} unit - Единица измерения
 * @property {mongoose.Types.ObjectId} targetOrderItemRef - Ссылка на пункт заказа
 * @property {string} note - Примечание
 */
export interface IWarehouseMovement extends Document {
  date: Date;
  type: 'INCOME' | 'OUTCOME';
  itemName: string;
  quantity: number;
  unit: string;
  targetOrderItemRef?: mongoose.Types.ObjectId;
  note: string;
}

const WarehouseMovementSchema = new Schema<IWarehouseMovement>({
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['INCOME', 'OUTCOME'], default: 'INCOME' },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String },
  targetOrderItemRef: { type: Schema.Types.ObjectId, ref: 'Order' },
  note: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

WarehouseMovementSchema.index({ date: -1 });

export const WarehouseMovement = mongoose.model<IWarehouseMovement>('WarehouseMovement', WarehouseMovementSchema);
