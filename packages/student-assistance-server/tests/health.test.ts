import request from 'supertest';
import { createTestApp } from './testApp';

const app = createTestApp();

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.service).toBe('student-assistance-server');
  });
});
