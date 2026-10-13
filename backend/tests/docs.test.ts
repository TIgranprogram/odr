import request from 'supertest';
import { app } from '../src/app';

describe('API documentation (T-6.4)', () => {
  it('GET /api/openapi.json отдаёт спецификацию без токена', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('ODR API');
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(10);
  });

  it('GET /api/docs отдаёт HTML Swagger UI без токена', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
  });
});
