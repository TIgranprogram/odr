import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dictionaryRoutes from './routes/dictionary';
import authRoutes from './routes/auth';
import requisitionRoutes from './routes/requisitions';
import invoiceRoutes from './routes/invoices';
import orderRoutes from './routes/orders';
import warehouseRoutes from './routes/warehouse';
import stockItemRoutes from './routes/stockItems';
import odrRoutes from './routes/odr';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/kppdf';
mongoose.connect(mongoURI)
  .then(() => console.log('🚀 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/dictionaries', dictionaryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/stockitems', stockItemRoutes);
app.use('/api/odr', odrRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
