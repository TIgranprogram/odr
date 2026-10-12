// env импортируется ПЕРВЫМ: из-за hoisting'а ES-импортов порядок импортов =
// порядок выполнения, значит dotenv.config() отработает до чтения process.env.
import './config/env';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { authMiddleware } from './middleware/auth.middleware';
import dictionaryRoutes from './routes/dictionary';
import authRoutes from './routes/auth';
import requisitionRoutes from './routes/requisitions';
import invoiceRoutes from './routes/invoices';
import orderRoutes from './routes/orders';
import warehouseRoutes from './routes/warehouse';
import stockItemRoutes from './routes/stockItems';
import odrRoutes from './routes/odr';

const app = express();
const PORT = env.port;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health Check (без авторизации)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Весь /api закрыт токеном, кроме /api/auth/* (login/register)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  return authMiddleware(req, res, next);
});

// Routes
app.use('/api/dictionaries', dictionaryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/stockitems', stockItemRoutes);
app.use('/api/odr', odrRoutes);

// 404-catch-all — ПОСЛЕ всех роутов
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Глобальный error-handler — ПОСЛЕ всех роутов (4 аргумента обязателены Express)
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;

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

// Database Connection
mongoose.connect(env.mongoUri)
  .then(() => console.log('🚀 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
