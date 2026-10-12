import mongoose, { Schema, Document } from 'mongoose';

/**
 * @interface IUser
 * @property {string} username - Уникальный логин
 * @property {string} password - Хэшированный пароль
 * @property {string} fullName - ФИО
 * @property {string} role - Роль ('ADMIN' | 'USER')
 * @property {boolean} isActive - Активность пользователя
 */
export interface IUser extends Document {
  username: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const User = mongoose.model<IUser>('User', UserSchema);
