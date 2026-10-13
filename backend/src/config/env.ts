import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Загрузка переменных окружения.
 *
 * ВАЖНО: этот модуль должен импортироваться ПЕРВЫМ в server.ts/seed.ts —
 * из-за hoisting'а импортов ES порядок импортов определяет порядок выполнения,
 * поэтому dotenv.config() отсюда гарантированно отработает ДО любого чтения process.env.
 *
 * .env лежит в корне проекта (D:\ОДР\.env), а backend запускается из D:\ОДР\backend,
 * поэтому ищем .env, поднимаясь вверх от рабочего каталога (работает и для ts-node,
 * и для скомпилированного dist/src/**, т.к. не зависит от __dirname).
 */
const candidates: string[] = [];
let dir = process.cwd();
for (let i = 0; i < 4; i++) {
  candidates.push(path.join(dir, '.env'));
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}

for (const file of candidates) {
  if (fs.existsSync(file)) {
    // dotenv по умолчанию НЕ перезаписывает уже заданные переменные,
    // поэтому безопасно загружать несколько файлов подряд.
    dotenv.config({ path: file });
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/kppdf',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key_here_change_me_in_prod',
  // Отдельный секрет для refresh-токенов: access и refresh не взаимозаменяемы.
  refreshSecret: process.env.REFRESH_SECRET || process.env.JWT_SECRET || 'your_refresh_secret_change_me_in_prod',
  // Белый список origin для CORS (через запятую). Пусто → разрешаем только same-origin/без Origin.
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
