import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import * as authService from '../src/services/auth.service';

beforeAll(async () => {
  await User.deleteMany({});
  await User.create({
    username: 'testadmin',
    password: await authService.hashPassword('secret123'),
    fullName: 'Test Admin',
    role: 'ADMIN',
    isActive: true,
  });
});

describe('POST /api/auth/login', () => {
  it('успешный вход отдаёт access и refresh токены', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.user.username).toBe('testadmin');
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('неверный пароль → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});
