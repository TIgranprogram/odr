import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * Неизменяемый снимок заявки на момент перехода статуса (T-6.2).
 * Снимок — это копия ключевых полей заявки; последующие правки заявки
 * на него не влияют. Update/delete на коллекцию запрещены хуками схемы.
 */
export interface IRequisitionSnapshot extends Document {
  requisitionId: mongoose.Types.ObjectId;
  /** Статус до перехода (для первого снимка — предыдущий статус) */
  previousStatus?: string;
  /** Статус после перехода */
  status: string;
  itemName: string;
  sku?: string;
  unit?: string;
  category?: string;
  company?: string;
  priority?: string;
  customer?: string;
  supplier?: string;
  color?: string;
  link?: string;
  note?: string;
  quantity: number;
  priceWithVat: number;
  /** Сумма позиции на момент перехода (priceWithVat * quantity) */
  lineTotal: number;
  requestedBy?: string;
  date?: Date;
  orderRef?: mongoose.Types.ObjectId;
  invoiceRef?: mongoose.Types.ObjectId;
  /** Кто совершил переход (username из JWT) */
  capturedBy?: string;
  organizationId: string;
  capturedAt: Date;
}

const RequisitionSnapshotSchema = new Schema<IRequisitionSnapshot>({
  requisitionId: { type: Schema.Types.ObjectId, ref: 'Requisition', required: true },
  previousStatus: { type: String },
  status: { type: String, required: true },
  itemName: { type: String, required: true },
  sku: { type: String },
  unit: { type: String },
  category: { type: String },
  company: { type: String },
  priority: { type: String },
  customer: { type: String },
  supplier: { type: String },
  color: { type: String },
  link: { type: String },
  note: { type: String },
  quantity: { type: Number, required: true },
  priceWithVat: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  requestedBy: { type: String },
  date: { type: Date },
  orderRef: { type: Schema.Types.ObjectId },
  invoiceRef: { type: Schema.Types.ObjectId },
  capturedBy: { type: String },
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: { createdAt: 'capturedAt', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// T-6.6: выборка снимков заявки по её id.
RequisitionSnapshotSchema.index({ requisitionId: 1 });

// Снимки неизменяемы: любые update/delete на уровне Mongoose запрещены.
const IMMUTABLE_METHODS = [
  'updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndDelete',
  'replaceOne', 'deleteOne', 'deleteMany',
] as const;
for (const method of IMMUTABLE_METHODS) {
  RequisitionSnapshotSchema.pre(method, function (next) {
    next(new Error('Requisition snapshots are immutable'));
  });
}

export const RequisitionSnapshot = mongoose.model<IRequisitionSnapshot>(
  'RequisitionSnapshot',
  RequisitionSnapshotSchema
);
