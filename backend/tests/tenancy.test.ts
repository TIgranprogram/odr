import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { Requisition } from '../src/models/Requisition';
import * as authService from '../src/services/auth.service';
import { env } from '../src/config/env';
import { DEFAULT_ORGANIZATION_ID } from '../src/utils/tenant';

let token = '';

beforeAll(async () => {
  await User.deleteMany({});
  await Requisition.deleteMany({});
  const admin = await User.create({
    username: 'orgadmin',
    password: 'x',
    fullName: 'Org Admin',
    role: 'ADMIN',
    isActive: true,
  });
  token = authService.generateAccessToken(admin);
});

describe('Tenant isolation (T-6.1)', () => {
  it('JWT содержит organizationId', () => {
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.organizationId).toBe(DEFAULT_ORGANIZATION_ID);
  });

  it('созданная заявка получает organizationId из JWT', async () => {
    const res = await request(app)
      .post('/api/requisitions')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemName: 'Товар', quantity: 1, priceWithVat: 100 });
    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBe(DEFAULT_ORGANIZATION_ID);
  });

  it('клиент не может задать organizationId в теле запроса', async () => {
    const res = await request(app)
      .post('/api/requisitions')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemName: 'Хакерский товар', quantity: 1, priceWithVat: 1, organizationId: 'evil-org' });
    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBe(DEFAULT_ORGANIZATION_ID);
  });

  it('старый токен без organizationId → fallback default-org и рабочий список', async () => {
    const admin = await User.findOne({ username: 'orgadmin' });
    const legacyToken = jwt.sign(
      { sub: 'orgadmin', id: String(admin?._id), role: 'ADMIN', fullName: 'Org Admin' },
      env.jwtSecret,
      { expiresIn: '5m' }
    );

    const res = await request(app)
      .get('/api/requisitions')
      .set('Authorization', `Bearer ${legacyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      (res.body as Array<{ organizationId?: string }>).every(
        (r) => r.organizationId === DEFAULT_ORGANIZATION_ID
      )
    ).toBe(true);
  });

  it('пользователь, созданный через API, получает organizationId и виден в списке', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'orguser', password: 'secret123', fullName: 'Org User' });
    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBe(DEFAULT_ORGANIZATION_ID);

    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect((list.body as Array<{ username: string }>).some((u) => u.username === 'orguser')).toBe(true);
  });

  it('запись без organizationId (легаси до миграции) не видна в списке с org-фильтром', async () => {
    // insertOne в обход mongoose — имитация записи, созданной до T-6.1
    await Requisition.collection.insertOne({
      itemName: 'Легаси-заявка',
      quantity: 1,
      priceWithVat: 1,
      requestedBy: 't',
      date: new Date(),
    } as unknown as Record<string, unknown>);

    const res = await request(app)
      .get('/api/requisitions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect((res.body as Array<{ itemName: string }>).some((r) => r.itemName === 'Легаси-заявка')).toBe(false);
  });

  it('отчёт ОДР работает с org-скоупом', async () => {
    const res = await request(app)
      .get('/api/odr?start=2026-01-01&end=2026-12-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalExpense).toBe('number');
    expect(typeof res.body.totalIncome).toBe('number');
  });
});
