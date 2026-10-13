// env импортируется ПЕРВЫМ: dotenv.config() должен отработать до чтения process.env.
import './config/env';
import mongoose from 'mongoose';
import { env } from './config/env';
import { app } from './app';

const PORT = env.port;

// Database Connection
mongoose.connect(env.mongoUri)
  .then(() => console.log('🚀 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
