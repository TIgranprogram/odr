import { User, IUser } from '../models/User';
import { hashPassword } from './auth.service';
import { ValidationError } from '../utils/validate';

/** Без пароля: хэш наружу не отдаём ни в одном ответе. */
const SAFE_FIELDS = '-password';

export const listUsers = async (): Promise<IUser[]> => {
  return await User.find().select(SAFE_FIELDS).sort({ username: 1 }).exec();
};

export const getUser = async (id: string): Promise<IUser | null> => {
  return await User.findById(id).select(SAFE_FIELDS).exec();
};

export const createUser = async (
  username: string,
  password: string,
  fullName: string,
  role: 'ADMIN' | 'USER'
): Promise<IUser> => {
  const hashed = await hashPassword(password);
  const user = new User({ username, password: hashed, fullName, role });
  const saved = await user.save();
  saved.password = '';
  return saved;
};

/**
 * Нельзя деактивировать/понизить/удалить последнего активного администратора —
 * иначе система останется без управления.
 */
const assertNotLastAdmin = async (id: string, nextRole?: string, nextActive?: boolean): Promise<void> => {
  const target = await User.findById(id).exec();
  if (!target || target.role !== 'ADMIN') return;
  if (nextRole !== undefined && nextRole !== 'ADMIN') {
    // понижение
  } else if (nextActive !== false) {
    return; // остаётся активным админом
  }

  const otherAdmins = await User.countDocuments({ _id: { $ne: id }, role: 'ADMIN', isActive: true }).exec();
  if (otherAdmins === 0) {
    throw new ValidationError('Cannot deactivate or demote the last active administrator');
  }
};

export const updateUser = async (
  id: string,
  updates: { fullName?: string; role?: 'ADMIN' | 'USER'; isActive?: boolean; password?: string }
): Promise<IUser | null> => {
  const target = await User.findById(id).exec();
  if (!target) return null;

  await assertNotLastAdmin(id, updates.role, updates.isActive);

  if (updates.fullName !== undefined) target.fullName = updates.fullName;
  if (updates.role !== undefined) target.role = updates.role;
  if (updates.isActive !== undefined) target.isActive = updates.isActive;
  if (updates.password) target.password = await hashPassword(updates.password);

  const saved = await target.save();
  saved.password = '';
  return saved;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const target = await User.findById(id).exec();
  if (!target) return false;
  await assertNotLastAdmin(id, 'USER', false);
  await User.findByIdAndDelete(id).exec();
  return true;
};
