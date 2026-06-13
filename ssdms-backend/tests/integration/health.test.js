require('dotenv').config();
const request = require('supertest');
const app = require('../../app');

describe('Integration — Health endpoint', () => {
  test('GET /health should return 200 and include database status', async () => {
    const res = await request(app).get('/health').timeout({ response: 5000, deadline: 10000 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks.database === 'connected' || res.body.checks.database === 'failed').toBeTruthy();
  });
});
