import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import * as authService from '../src/services/auth.service';

let token = '';

beforeAll(async () => {
  await User.deleteMany({});
  await User.create({
    username: 'reqadmin',
    password: await authService.hashPassword('secret123'),
    fullName: 'Req Admin',
    role: 'ADMIN',
    isActive: true,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'reqadmin', password: 'secret123' });
  token = res.body.accessToken;
});

describe('GET /api/requisitions', () => {
  it('без токена → 401', async () => {
    const res = await request(app).get('/api/requisitions');
    expect(res.status).toBe(401);
  });

  it('с токеном → 200 и массив', async () => {
    const res = await request(app)
      .get('/api/requisitions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
