import { Router } from 'express';
import { login, register, refresh } from '../controllers/auth.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { rateLimit } from '../utils/rateLimit';

const router = Router();

// Ограничение перебора пароля: 10 попыток на IP за 15 минут.
const loginLimiter = rateLimit(10, 15 * 60 * 1000);

router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
// Создавать пользователей может только ADMIN (bootstrap-админ создаётся seed'ом).
router.post('/register', authMiddleware, roleMiddleware(['ADMIN']), register);

export default router;
