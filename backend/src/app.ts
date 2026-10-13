// env импортируется ПЕРВЫМ: из-за hoisting'а ES-импортов порядок импортов =
// порядок выполнения, значит dotenv.config() отработает до чтения process.env.
import './config/env';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { authMiddleware, roleMiddleware } from './middleware/auth.middleware';
import { ValidationError } from './utils/validate';
import dictionaryRoutes from './routes/dictionary';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import requisitionRoutes from './routes/requisitions';
import invoiceRoutes from './routes/invoices';
import orderRoutes from './routes/orders';
import warehouseRoutes from './routes/warehouse';
import stockItemRoutes from './routes/stockItems';
import productRoutes from './routes/products';
import additionalIncomeRoutes from './routes/additionalIncomes';
import odrRoutes from './routes/odr';
import docsRoutes from './routes/docs';

export const app = express();

// Middleware
app.use(helmet());
// CORS только для разрешённых origin (env.corsOrigins). Запросы без Origin
// (curl, same-origin) пропускаем — иначе сломается health/CI.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health Check (без авторизации). 503, если БД недоступна (readyState !== 1).
app.get('/health', (_req: Request, res: Response) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'up' : 'down',
    timestamp: new Date(),
  });
});

// Весь /api закрыт токеном, кроме /api/auth/* (login/register) и документации API
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/docs') || req.path === '/openapi.json') {
    return next();
  }
  return authMiddleware(req, res, next);
});

// Routes
app.use('/api', docsRoutes);
app.use('/api/dictionaries', dictionaryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', roleMiddleware(['ADMIN']), userRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/stockitems', stockItemRoutes);
app.use('/api/products', productRoutes);
app.use('/api/additional-incomes', additionalIncomeRoutes);
app.use('/api/odr', odrRoutes);

// 404-catch-all — ПОСЛЕ всех роутов
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Глобальный error-handler — ПОСЛЕ всех роутов (4 аргумента обязателены Express)
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;

  // Ошибки валидации входных данных (utils/validate) → 400
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  // CORS: origin не в белом списке → 403
  if (err instanceof Error && err.message.startsWith('Origin not allowed by CORS')) {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }

  // Некорректный JSON в теле запроса (express.json)
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  // mongoose CastError (например, невалидный ObjectId в /:id) → 400, а не 500
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid value for "${err.path}": ${err.value}` });
  }

  // Ошибки валидации mongoose → 400
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  // Уникальный индекс (например, username) → 409
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ error: 'Duplicate value: such record already exists' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);
