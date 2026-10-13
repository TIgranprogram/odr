import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

/** Одно изменение поля в рамках UPDATE/DELETE (shallow-diff). */
export interface IAuditChange {
  field: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Журнал аудита (T-6.3): кто/когда/что изменил в основных сущностях.
 * Записи создаются сервисом audit.service (ошибка записи аудита не роняет
 * основную операцию); отдельных update/delete-эндпоинтов нет.
 */
export interface IAuditLog extends Document {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  action: AuditAction;
  userId?: string;
  username?: string;
  changes?: IAuditChange[];
  organizationId: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  userId: { type: String },
  username: { type: String },
  changes: [
    {
      _id: false,
      field: { type: String, required: true },
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
  ],
  organizationId: { type: String, default: DEFAULT_ORGANIZATION_ID },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// T-6.6: горячие поля журнала — сортировка по дате и фильтр «тип + дата».
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
