import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { RequisitionSnapshot } from '../src/models/RequisitionSnapshot';
import * as authService from '../src/services/auth.service';

let token = '';
let authHeader = '';

beforeAll(async () => {
  await User.deleteMany({});
  const admin = await User.create({
    username: 'snapadmin',
    password: 'x',
    fullName: 'Snapshot Admin',
    role: 'ADMIN',
    isActive: true,
  });
  token = authService.generateAccessToken(admin);
  authHeader = `Bearer ${token}`;
});

describe('Снимки заявок (T-6.2)', () => {
  it('снимок создаётся при переходе статуса; правка заявки НЕ меняет ранее созданный снимок', async () => {
    const created = await request(app)
      .post('/api/requisitions')
      .set('Authorization', authHeader)
      .send({ itemName: 'Кабель', quantity: 3, priceWithVat: 200, customer: 'Цех' });
    expect(created.status).toBe(201);
    const id = created.body._id as string;
    expect(created.body.status).toBe('⏳ Ожидает');

    // До перехода статуса снимков нет
    let res = await request(app)
      .get(`/api/requisitions/${id}/snapshots`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);

    // Переход статуса → снимок
    const put = await request(app)
      .put(`/api/requisitions/${id}`)
      .set('Authorization', authHeader)
      .send({ status: '☑️ Получено' });
    expect(put.status).toBe(200);

    res = await request(app).get(`/api/requisitions/${id}/snapshots`).set('Authorization', authHeader);
    expect(res.body).toHaveLength(1);
    const snap = res.body[0];
    expect(snap.status).toBe('☑️ Получено');
    expect(snap.previousStatus).toBe('⏳ Ожидает');
    expect(snap.itemName).toBe('Кабель');
    expect(snap.quantity).toBe(3);
    expect(snap.priceWithVat).toBe(200);
    expect(snap.lineTotal).toBe(600);
    expect(snap.capturedBy).toBe('snapadmin');
    const snapshotId = snap._id as string;

    // Правка заявки (без смены статуса) не создаёт снимков и не меняет старый
    const edit = await request(app)
      .put(`/api/requisitions/${id}`)
      .set('Authorization', authHeader)
      .send({ itemName: 'Кабель (переименован)', priceWithVat: 9999, quantity: 10 });
    expect(edit.status).toBe(200);

    res = await request(app).get(`/api/requisitions/${id}/snapshots`).set('Authorization', authHeader);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(snapshotId);
    expect(res.body[0].itemName).toBe('Кабель');
    expect(res.body[0].priceWithVat).toBe(200);
    expect(res.body[0].quantity).toBe(3);
    expect(res.body[0].lineTotal).toBe(600);

    // Второй переход статуса → второй снимок (новые сверху)
    await request(app)
      .put(`/api/requisitions/${id}`)
      .set('Authorization', authHeader)
      .send({ status: '💰 Оплачено' });
    res = await request(app).get(`/api/requisitions/${id}/snapshots`).set('Authorization', authHeader);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].status).toBe('💰 Оплачено');
    expect(res.body[0].previousStatus).toBe('☑️ Получено');
    expect(res.body[1].status).toBe('☑️ Получено');
  });

  it('эндпоинтов изменения снимков нет (update/delete → 404)', async () => {
    const fakeId = '000000000000000000000000';
    const put = await request(app)
      .put(`/api/requisitions/${fakeId}/snapshots`)
      .set('Authorization', authHeader)
      .send({ status: 'x' });
    expect(put.status).toBe(404);

    const del = await request(app)
      .delete(`/api/requisitions/${fakeId}/snapshots`)
      .set('Authorization', authHeader);
    expect(del.status).toBe(404);
  });

  it('модель запрещает update/delete на уровне Mongoose (неизменяемость)', async () => {
    const snap = await RequisitionSnapshot.create({
      requisitionId: new mongoose.Types.ObjectId(),
      status: 'X',
      itemName: 'Тест',
      quantity: 1,
      priceWithVat: 1,
      lineTotal: 1,
    });

    await expect(
      RequisitionSnapshot.updateOne({ _id: snap._id }, { status: 'Y' }).exec()
    ).rejects.toThrow(/immutable/);
    await expect(RequisitionSnapshot.deleteMany({ _id: snap._id }).exec()).rejects.toThrow(/immutable/);
  });
});
