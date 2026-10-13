import mongoose from 'mongoose';

// Тестовая БД: не трогаем рабочую (kppdf). Можно переопределить MONGO_URI_TEST.
const TEST_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/odr_test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
