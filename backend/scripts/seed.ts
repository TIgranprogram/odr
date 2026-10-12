import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as DictionaryService from './src/services/dictionary.service';
import * as RequisitionService from './src/services/requisition.service';
import * as StockItemService from './src/services/stockItem.service';
import { User } from './src/models/User';
import fs from 'fs';
import path from 'path';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/kppdf';

function parseCSV(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2,})*[^"]*)/);
    const obj: any = {};
    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim().replace(/"/g, '') : '';
      obj[header] = val;
    });
    return obj;
  });
}

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    // Note: In production we wouldn't delete everything, but for seeding it's okay.
    // We should also clear other collections here.

    // 1. Seed Dictionary (Categories, Units, etc.)
    const categories = ['Оборудование', 'Покупные изделия', 'Расходники', 'Метизы', 'Услуги'];
    for (const cat of categories) {
      await DictionaryService.createItem('Категория', 'Types', cat);
    }

    const units = ['шт', 'м', 'м2', 'м3', 'компл', 'уп', 'пара'];
    for (const u of units) {
      await DictionaryService.createItem('Ед. изм.', 'Units', u);
    }

    // 2. Seed Suppliers from Снабжение.csv
    const supplyFilePath = 'D:/ОДР/данные для заполнения на сайте/Снабжение - Снабжение.csv';
    if (fs.existsSync(supplyFilePath)) {
      const supplyData = parseCSV(supplyFilePath);
      const suppliers = new Set();
      supplyData.forEach(row => {
        if (row['Поставщик']) suppliers.add(row['Поставщик'].trim());
      });
      for (const s of suppliers) {
        await DictionaryService.createItem('Поставщик', 'Suppliers', s);
      }
      console.log(`Seeded ${suppliers.size} suppliers.`);
    }

    // 3. Seed Customers from Снабжение.csv
    if (fs.existsSync(supplyFilePath)) {
      const supplyData = parseCSV(supplyFilePath);
      const customers = new Set();
      supplyData.forEach(row => {
        if (row['Заказчик']) customers.add(row['Заказчик'].trim());
      });
      for (const c of customers) {
        await DictionaryService.createItem('Заказчик', 'Customers', c);
      }
      console.log(`Seeded ${customers.size} customers.`);
    }

    // 4. Seed StockItems from Склад.csv
    const stockFilePath = 'D:/ОДР/данные для заполнения на сайте/Склад - Склад.csv';
    if (fs.existsSync(stockFilePath)) {
      const stockData = parseCSV(stockFilePath);
      for (const item of stockData.slice(1)) {
        if (item['Наименование ТМЦ']) {
          await StockItemService.create({
            name: item['Наименование ТМЦ'],
            category: item['Категория'],
            unit: item['Ед. изм.'],
            initialStock: Number(item['Начальный остаток'] || 0),
            received: Number(item['Поступило'] || 0),
            reserved: Number(item['Забронировано'] || 0),
            writtenOff: Number(item['Списано'] || 0),
            currentStock: Number(item['Текущий остаток'] || 0),
            freeStock: Number(item['Свободный остаток'] || 0),
            status: item['Статус наличия'] || '✅ В норме',
            minStock: Number(item['Мин. остаток'] || 0),
            weight: Number(item['Вес 1 шт.'] || 0)
          });
        }
      }
      console.log('✅ Seeded Stock Items.');
    }

    // 5. Seed Requisitions from Снабжение.csv
    if (fs.existsSync(supplyFilePath)) {
      const supplyData = parseCSV(supplyFilePath);
      for (const row of supplyData) {
        if (row['Наименование']) {
          await RequisitionService.create({
            date: new Date(row['Дата']),
            category: row['Категория'],
            itemName: row['Наименование'],
            sku: row['Артикул'],
            unit: row['Ед_изм.'],
            quantity: Number(row['Кол-во']),
            requestedBy: row['Подал заявку'],
            priority: row['Приоритет'],
            status: row['Статус'],
            company: row['Наша Компания'],
            customer: row['Заказчик'],
            supplier: row['Поставщик'],
            link: row['Ссылка'],
            color: row['Цвет'],
            note: row['Примечание'],
            priceWithVat: Number(row['Цена с НДС'] || 0),
            invoiceRef: row['№ Счета'] || undefined,
            orderRef: row['Заказ'] || undefined
          });
        }
      }
      console.log('✅ Seeded Requisitions.');
    }

    console.log('✅ All data seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
