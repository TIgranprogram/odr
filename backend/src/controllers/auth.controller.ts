import { Request, Response } from 'express';
import { User } from '../models/User';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await authService.verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.json({
      user: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, role } = req.body;
    const hashedPassword = await authService.hashPassword(password);

    const newUser = new User({
      username,
      password: hashedPassword,
      fullName,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
