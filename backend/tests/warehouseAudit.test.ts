import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { WarehouseMovement } from '../src/models/WarehouseMovement';
import { AuditLog } from '../src/models/AuditLog';
import * as authService from '../src/services/auth.service';
import { DEFAULT_ORGANIZATION_ID } from '../src/utils/tenant';

let adminToken = '';

beforeAll(async () => {
  await User.deleteMany({});
  await WarehouseMovement.deleteMany({});
  await AuditLog.deleteMany({ entityType: 'warehouse' });
  const admin = await User.create({
    username: 'whadmin',
    password: 'x',
    fullName: 'Warehouse Admin',
    role: 'ADMIN',
    isActive: true,
  });
  adminToken = authService.generateAccessToken(admin);
});

const createMovement = async (): Promise<string> => {
  const res = await request(app)
    .post('/api/warehouse')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ type: 'INCOME', date: new Date(), itemName: 'Болт М8', quantity: 10, unit: 'шт', note: 'приход' });
  expect(res.status).toBe(201);
  return res.body._id as string;
};

describe('Warehouse audit (складские движения логируются)', () => {
  it('создание движения пишет запись CREATE', async () => {
    const id = await createMovement();

    const res = await request(app)
      .get(`/api/audit-logs?entityType=warehouse&entityId=${id}&action=CREATE`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);

    const entry = res.body.items[0];
    expect(entry.action).toBe('CREATE');
    expect(entry.entityType).toBe('warehouse');
    expect(entry.entityId).toBe(id);
    expect(entry.username).toBe('whadmin');
    expect(entry.organizationId).toBe(DEFAULT_ORGANIZATION_ID);
  });

  it('правка движения пишет UPDATE с изменёнными полями', async () => {
    const id = await createMovement();

    const put = await request(app)
      .put(`/api/warehouse/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 5, note: 'списание' });
    expect(put.status).toBe(200);

    const res = await request(app)
      .get(`/api/audit-logs?entityType=warehouse&entityId=${id}&action=UPDATE`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.total).toBe(1);

    const changes = res.body.items[0].changes as Array<{ field: string; before: unknown; after: unknown }>;
    expect(changes.find((c) => c.field === 'quantity')?.before).toBe(10);
    expect(changes.find((c) => c.field === 'quantity')?.after).toBe(5);
    expect(changes.find((c) => c.field === 'note')?.before).toBe('приход');
    expect(changes.find((c) => c.field === 'note')?.after).toBe('списание');
  });

  it('удаление движения пишет DELETE со значениями до удаления', async () => {
    const id = await createMovement();

    const del = await request(app)
      .delete(`/api/warehouse/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const res = await request(app)
      .get(`/api/audit-logs?entityType=warehouse&entityId=${id}&action=DELETE`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.total).toBe(1);

    const changes = res.body.items[0].changes as Array<{ field: string; before: unknown }>;
    expect(changes.find((c) => c.field === 'itemName')?.before).toBe('Болт М8');
  });

  it('невалидное type движения → 400', async () => {
    const res = await request(app)
      .post('/api/warehouse')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'EXPENSE', itemName: 'X', quantity: 1 });
    expect(res.status).toBe(400);
  });
});
