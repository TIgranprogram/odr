import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_me_in_prod';

export const generateAccessToken = (user: any) => {
  return jwt.sign(
    { sub: user.username, role: user.role, id: user._id },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { sub: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
