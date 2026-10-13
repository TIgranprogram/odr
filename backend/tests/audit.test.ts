import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { Requisition } from '../src/models/Requisition';
import * as authService from '../src/services/auth.service';
import { DEFAULT_ORGANIZATION_ID } from '../src/utils/tenant';

let adminToken = '';
let userToken = '';

beforeAll(async () => {
  await User.deleteMany({});
  await Requisition.deleteMany({});
  const admin = await User.create({
    username: 'auditadmin',
    password: 'x',
    fullName: 'Audit Admin',
    role: 'ADMIN',
    isActive: true,
  });
  const user = await User.create({
    username: 'audituser',
    password: 'x',
    fullName: 'Audit User',
    role: 'USER',
    isActive: true,
  });
  adminToken = authService.generateAccessToken(admin);
  userToken = authService.generateAccessToken(user);
});

const createRequisition = async (): Promise<string> => {
  const res = await request(app)
    .post('/api/requisitions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ itemName: 'Подшипник', quantity: 2, priceWithVat: 1000, customer: 'Цех №1' });
  expect(res.status).toBe(201);
  return res.body._id as string;
};

describe('Audit log (T-6.3)', () => {
  it('создание заявки пишет запись CREATE (кто/когда/что)', async () => {
    const id = await createRequisition();

    const res = await request(app)
      .get(`/api/audit-logs?entityType=requisitions&entityId=${id}&action=CREATE`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    const entry = res.body.items[0];
    expect(entry.action).toBe('CREATE');
    expect(entry.entityType).toBe('requisitions');
    expect(entry.entityId).toBe(id);
    expect(entry.username).toBe('auditadmin');
    expect(entry.organizationId).toBe(DEFAULT_ORGANIZATION_ID);
  });

  it('правка заявки пишет UPDATE с shallow-diff изменённых полей', async () => {
    const id = await createRequisition();

    const put = await request(app)
      .put(`/api/requisitions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: '✅ Заказать', quantity: 5 });
    expect(put.status).toBe(200);

    const res = await request(app)
      .get(`/api/audit-logs?entityType=requisitions&entityId=${id}&action=UPDATE`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.total).toBe(1);

    const changes = res.body.items[0].changes as Array<{ field: string; before: unknown; after: unknown }>;
    const statusChange = changes.find((c) => c.field === 'status');
    expect(statusChange?.before).toBe('⏳ Ожидает');
    expect(statusChange?.after).toBe('✅ Заказать');
    const qtyChange = changes.find((c) => c.field === 'quantity');
    expect(qtyChange?.before).toBe(2);
    expect(qtyChange?.after).toBe(5);
  });

  it('удаление заявки пишет DELETE со значениями полей до удаления', async () => {
    const id = await createRequisition();
    const del = await request(app)
      .delete(`/api/requisitions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const res = await request(app)
      .get(`/api/audit-logs?entityType=requisitions&entityId=${id}&action=DELETE`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.total).toBe(1);
    const changes = res.body.items[0].changes as Array<{ field: string; before: unknown }>;
    expect(changes.find((c) => c.field === 'itemName')?.before).toBe('Подшипник');
  });

  it('без токена → 401, с ролью USER → 403', async () => {
    const noToken = await request(app).get('/api/audit-logs');
    expect(noToken.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('фильтры и пагинация работают', async () => {
    const id = await createRequisition();

    // CREATE + UPDATE + DELETE для одной заявки
    await request(app)
      .put(`/api/requisitions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'скорректировано' });
    await request(app)
      .delete(`/api/requisitions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const page1 = await request(app)
      .get(`/api/audit-logs?entityType=requisitions&entityId=${id}&page=1&limit=2`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(page1.body.total).toBe(3);
    expect(page1.body.page).toBe(1);
    expect(page1.body.limit).toBe(2);
    expect(page1.body.items).toHaveLength(2);

    const page2 = await request(app)
      .get(`/api/audit-logs?entityType=requisitions&entityId=${id}&page=2&limit=2`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(page2.body.items).toHaveLength(1);

    // фильтр по дате: записи уже существуют → диапазон «от сегодня» их не включает
    const today = new Date().toISOString();
    const future = await request(app)
      .get(`/api/audit-logs?entityType=requisitions&entityId=${id}&startDate=${today}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(future.body.total).toBe(0);
  });

  it('невалидное значение action → 400', async () => {
    const res = await request(app)
      .get('/api/audit-logs?action=WRONG')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});
