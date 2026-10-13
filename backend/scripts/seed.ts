// env импортируется ПЕРВЫМ: dotenv.config() должен отработать до чтения process.env
// (порядок ES-импортов = порядок выполнения модулей).
import '../src/config/env';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import * as DictionaryService from '../src/services/dictionary.service';
import * as RequisitionService from '../src/services/requisition.service';
import * as StockItemService from '../src/services/stockItem.service';
import * as ProductService from '../src/services/product.service';
import * as AuthService from '../src/services/auth.service';
import { User } from '../src/models/User';
import { Dictionary } from '../src/models/Dictionary';
import { Requisition, type IRequisition } from '../src/models/Requisition';
import { StockItem } from '../src/models/StockItem';
import { Product } from '../src/models/Product';

/**
 * Папка с CSV-выгрузками. Приоритет: SEED_DATA_DIR (env/docker), иначе —
 * путь относительно корня репозитория (backend запускается из ./backend).
 */
function resolveDataDir(): string {
  if (process.env.SEED_DATA_DIR) return process.env.SEED_DATA_DIR;
  const candidates = [
    path.resolve(process.cwd(), 'данные для заполнения на сайте', 'data'),
    path.resolve(process.cwd(), '..', 'данные для заполнения на сайте', 'data'),
  ];
  return candidates.find((dir) => fs.existsSync(dir)) ?? candidates[0];
}

const DATA_DIR = resolveDataDir();
const SUPPLY_CSV = path.join(DATA_DIR, 'Снабжение - Снабжение.csv');
const STOCK_CSV = path.join(DATA_DIR, 'Склад - Склад.csv');
const PRODUCTS_CSV = path.join(DATA_DIR, 'db_spotninyg - products.csv');

/** Явная ошибка вместо «молча залили 0 записей». */
function assertFileExists(filePath: string, label: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(
      `❌ ${label}: файл не найден — ${filePath}\n` +
      `   Задайте SEED_DATA_DIR или положите выгрузки в «данные для заполнения на сайте/data».`
    );
    process.exit(1);
  }
}

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/kppdf';

// Категории справочника — ДОГОВОРЕННОСТЬ С ФРОНТОМ:
// Types (тип/категория ТМЦ), Units (ед. изм.), Suppliers (поставщики), Customers (заказчики).
const DICTIONARY_CATEGORIES = {
  types: 'Types',
  units: 'Units',
  suppliers: 'Suppliers',
  customers: 'Customers',
} as const;

/** Разбор строки CSV с учётом кавычек и "" внутри значений. */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Читает CSV в массив объектов «заголовок → значение».
 * headerMarker позволяет найти строку-шапку по содержимому: в «Склад - Склад.csv»
 * первые 5 строк — баннеры, реальная шапка начинается с «Фото,Категория,...».
 */
function parseCSV(filePath: string, headerMarker?: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Файл не найден: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  let headerIndex = 0;
  if (headerMarker) {
    const found = lines.findIndex(line => line.includes(headerMarker));
    headerIndex = found >= 0 ? found : 0;
  }

  const headers = splitCsvLine(lines[headerIndex]).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

/** Дата вида «19.08.2026» (dd.mm.yyyy) → Date. new Date('19.08.2026') даёт Invalid Date. */
function parseDate(value: string): Date | undefined {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec((value || '').trim());
  if (!match) return undefined;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Цена вида «5 760,00 ₽» → 5760. Убираем пробелы/nbsp/₽, запятую меняем на точку. */
function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[\s\u00A0\u202F]/g, '')
    .replace(/₽|руб\.?/gi, '')
    .replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

const isValidPriority = (value: string): boolean =>
  value === 'Срочно' || value === 'Обычный' || value === 'Низко';

const isValidCompany = (value: string): boolean => value === 'СИЮ' || value === 'ССЮ';

async function seed() {
  let failures = 0;
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Проверяем наличие обязательных выгрузок ДО очистки БД.
    assertFileExists(SUPPLY_CSV, 'Заявки/Снабжение');
    assertFileExists(STOCK_CSV, 'Склад');
    assertFileExists(PRODUCTS_CSV, 'Каталог (products)');

    const supplyData = parseCSV(SUPPLY_CSV);
    const stockData = parseCSV(STOCK_CSV, 'Наименование ТМЦ');
    const productsData = parseCSV(PRODUCTS_CSV, 'Внутренний_SKU');

    // Dev-инструмент: очистка перед заливкой, чтобы повторный запуск не дублировал данные.
    // Пользователей НЕ удаляем — админ создаётся upsert'ом по username.
    const dictWiped = (await DictionaryService.getAll()).length;
    const reqWiped = (await RequisitionService.getAll()).length;
    const stockWiped = (await StockItemService.getAll()).length;
    const productsWiped = (await ProductService.getAll()).length;
    await clearCollections();
    console.log(`🧹 Очищено перед заливкой: dictionary=${dictWiped}, requisitions=${reqWiped}, stock=${stockWiped}, products=${productsWiped}`);

    // 1. Dev-админ (без удаления существующих пользователей — upsert по username)
    const adminPasswordHash = await AuthService.hashPassword('admin123');
    const adminResult = await User.updateOne(
      { username: 'admin' },
      {
        $setOnInsert: {
          username: 'admin',
          password: adminPasswordHash,
          fullName: 'Администратор',
          role: 'ADMIN',
          isActive: true,
        },
      },
      { upsert: true }
    );
    if (adminResult.upsertedCount) {
      console.log('✅ Создан dev-админ: admin / admin123 (role=ADMIN)');
    } else {
      console.log('ℹ️ Пользователь admin уже существует — пропускаем создание.');
    }

    // 2. Справочник: name = value = реальное значение (иначе в UI колонки пустые).
    // T-3.3: категории = дефолтные ∪ категории из заявок ∪ категории каталога.
    const defaultCategories = ['Оборудование', 'Покупные изделия', 'Расходники', 'Метизы', 'Услуги'];
    const categoriesSet = new Set<string>(defaultCategories);
    for (const row of supplyData) {
      const cat = (row['Категория'] || '').trim();
      if (cat) categoriesSet.add(cat);
    }
    for (const row of productsData) {
      const cat = (row['Категория'] || '').trim();
      if (cat) categoriesSet.add(cat);
    }
    const categories = Array.from(categoriesSet);
    for (const cat of categories) {
      await DictionaryService.createItem(cat, DICTIONARY_CATEGORIES.types, cat);
    }

    const units = ['шт', 'м', 'м2', 'м3', 'компл', 'уп', 'пара'];
    for (const u of units) {
      await DictionaryService.createItem(u, DICTIONARY_CATEGORIES.units, u);
    }
    console.log(`✅ Справочник: Types=${categories.length}, Units=${units.length}`);

    // 3. Поставщики и заказчики из Снабжение.csv
    const suppliers = new Set<string>();
    const customers = new Set<string>();
    for (const row of supplyData) {
      const supplier = (row['Поставщик'] || '').trim();
      const customer = (row['Заказчик'] || '').trim();
      if (supplier) suppliers.add(supplier);
      if (customer) customers.add(customer);
    }
    for (const s of suppliers) {
      await DictionaryService.createItem(s, DICTIONARY_CATEGORIES.suppliers, s);
    }
    for (const c of customers) {
      await DictionaryService.createItem(c, DICTIONARY_CATEGORIES.customers, c);
    }
    console.log(`✅ Справочник: Suppliers=${suppliers.size}, Customers=${customers.size}`);

    // 4. Склад из Склад - Склад.csv (шапка ищется по содержимому)
    let stockSeeded = 0;
    for (const item of stockData) {
      const name = (item['Наименование ТМЦ'] || '').trim();
      if (!name) continue;
      try {
        await StockItemService.create({
          name,
          category: item['Категория'] || 'Прочее',
          unit: item['Ед. изм.'] || 'шт',
          initialStock: parseNumber(item['Начальный остаток']),
          received: parseNumber(item['Поступило']),
          reserved: parseNumber(item['Забронировано']),
          writtenOff: parseNumber(item['Списано']),
          currentStock: parseNumber(item['Текущий остаток']),
          freeStock: parseNumber(item['Свободный остаток']),
          status: item['Статус наличия'] || '✅ В норме',
          minStock: parseNumber(item['Мин. остаток']),
          weight: parseNumber(item['Вес 1 шт.']),
        });
        stockSeeded++;
      } catch (err) {
        failures++;
        console.error(`❌ Склад «${name}»:`, err instanceof Error ? err.message : err);
      }
    }
    console.log(`✅ Склад: ${stockSeeded} позиций (строк с шапкой: ${stockData.length}).`);

    // 4.1. Каталог номенклатуры из db_spotninyg - products.csv (T-3.1)
    let productsSeeded = 0;
    for (const row of productsData) {
      const internalSku = (row['Внутренний_SKU'] || '').trim();
      const name = (row['Модель_Наименование'] || '').trim() || (row['Полное_Наименование'] || '').trim();
      if (!internalSku || !name) continue;
      try {
        await ProductService.create({
          supplierArticle: row['Артикул_Поставщика'] || '',
          internalSku,
          category: row['Категория'] || '',
          subcategory: row['Подкатегория_Тип'] || '',
          brand: row['Бренд'] || '',
          name,
          size: row['Параметры_Размер'] || '',
          supplier: row['Поставщик'] || '',
          price: parseNumber(row['Цена']),
          unit: row['Ед_Изм'] || '',
          fullName: row['Полное_Наименование'] || '',
        });
        productsSeeded++;
      } catch (err) {
        failures++;
        console.error(`❌ Товар «${name}»:`, err instanceof Error ? err.message : err);
      }
    }
    console.log(`✅ Каталог: ${productsSeeded} позиций (строк с шапкой: ${productsData.length}).`);

    // 5. Заявки из Снабжение.csv
    let requisitionsSeeded = 0;
    for (const row of supplyData) {
      const itemName = (row['Наименование'] || '').trim();
      if (!itemName) continue;

      const payload: Partial<IRequisition> & Record<string, unknown> = {
        itemName,
        quantity: parseNumber(row['Кол-во']),
        unit: row['Ед_изм.'] || undefined,
        sku: row['Артикул'] || undefined,
        color: row['Цвет'] || undefined,
        supplier: row['Поставщик'] || undefined,
        link: row['Ссылка'] || undefined,
        note: row['Примечание'] || undefined,
        customer: row['Заказчик'] || '',
        requestedBy: row['Подал заявку'] || 'Импорт CSV',
        priceWithVat: parseNumber(row['Цена с НДС']),
        category: row['Категория'] || undefined, // пусто → default «Прочее»
      };

      const date = parseDate(row['Дата']);
      if (date) payload.date = date;

      // Пустой приоритет → default «Обычный» (не передаём поле вовсе)
      const priority = row['Приоритет'] || '';
      if (isValidPriority(priority)) payload.priority = priority;

      // Пустая компания в 4 строках CSV → default «СИЮ»
      payload.company = isValidCompany(row['Наша Компания'] || '')
        ? row['Наша Компания']
        : 'СИЮ';

      const status = row['Статус'] || '';
      if (status) payload.status = status;

      // invoiceRef НЕ заполняем: в CSV лежат номера вида «10478», «ТЗ2-000379»,
      // а поле — ObjectId → CastError. orderRef не заполняем: колонки «Заказ» в CSV нет.

      try {
        await RequisitionService.create(payload);
        requisitionsSeeded++;
      } catch (err) {
        failures++;
        console.error(`❌ Заявка «${itemName}»:`, err instanceof Error ? err.message : err);
      }
    }
    console.log(`✅ Заявки: ${requisitionsSeeded} из ${supplyData.length} строк.`);

    console.log(failures === 0
      ? '✅ All data seeded successfully.'
      : `⚠️ Seeded with ${failures} failed records.`);
    process.exit(failures === 0 ? 0 : 1);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

/** Очистка коллекций, наполняемых seed'ом (пользователи не трогаются). */
async function clearCollections() {
  await Promise.all([
    Dictionary.deleteMany({}),
    Requisition.deleteMany({}),
    StockItem.deleteMany({}),
    Product.deleteMany({}),
  ]);
}

seed();
