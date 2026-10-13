import mongoose from 'mongoose';
import { Requisition } from '../src/models/Requisition';
import { Invoice } from '../src/models/Invoice';
import { AdditionalIncome } from '../src/models/AdditionalIncome';
import * as odrService from '../src/services/odr.service';

const start = new Date('2026-01-01T00:00:00.000Z');
const end = new Date('2026-12-31T23:59:59.999Z');
const day = (n: number) => new Date(`2026-06-${String(n).padStart(2, '0')}T12:00:00.000Z`);

beforeEach(async () => {
  await Promise.all([
    Requisition.deleteMany({}),
    Invoice.deleteMany({}),
    AdditionalIncome.deleteMany({}),
  ]);
});

describe('odr.service.getReport', () => {
  it('расход = priceWithVat * quantity только для статусов в работе и без счёта', async () => {
    await Requisition.create([
      { itemName: 'A', quantity: 2, priceWithVat: 1000, requestedBy: 't', status: '✅ Заказать', date: day(1) },
      { itemName: 'B', quantity: 3, priceWithVat: 500, requestedBy: 't', status: '☑️ Получено', date: day(2) },
      // статус вне ODR → не учитывается
      { itemName: 'C', quantity: 10, priceWithVat: 999, requestedBy: 't', status: '⏳ Ожидает', date: day(3) },
      // покрыта счётом → исключается (нет двойного учёта)
      { itemName: 'D', quantity: 4, priceWithVat: 100, requestedBy: 't', status: '✅ Заказать', date: day(4), invoiceRef: new mongoose.Types.ObjectId() },
    ]);

    await Invoice.create([{
      invoiceNumber: 'INV-1', supplier: 'S', invoiceType: 'Тип', company: 'СИЮ',
      items: [{ itemName: 'A', quantity: 1, price: 1, sum: 1 }],
      totalAmount: 5000, isPaid: true, invoiceDate: day(10),
    }]);

    await AdditionalIncome.create([{ date: day(11), amount: 200, category: 'Услуги' }]);

    const report = await odrService.getReport(start, end);
    expect(report.totalExpense).toBe(2 * 1000 + 3 * 500);
    expect(report.totalIncome).toBe(5000 + 200);
    expect(report.net).toBe(5200 - 3500);
  });

  it('исключает записи вне периода', async () => {
    await Requisition.create([
      { itemName: 'In', quantity: 1, priceWithVat: 100, requestedBy: 't', status: '💰 Оплачено', date: day(5) },
      { itemName: 'Out', quantity: 1, priceWithVat: 100, requestedBy: 't', status: '💰 Оплачено', date: new Date('2025-01-01T12:00:00.000Z') },
    ]);

    const report = await odrService.getReport(start, end);
    expect(report.totalExpense).toBe(100);
  });
});
