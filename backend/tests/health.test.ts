import request from 'supertest';
import { app } from '../src/app';

describe('GET /health', () => {
  it('возвращает 200 и db=up при подключённой БД', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(typeof res.body.timestamp).toBe('string');
  });
});
