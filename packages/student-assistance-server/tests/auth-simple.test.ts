import request from 'supertest';
import { createTestApp } from './testApp';
import { testPrisma, createTestUser } from './setup';

const app = createTestApp();

describe('Authentication Core', () => {
  it('should login with valid credentials', async () => {
    const user = await createTestUser('admin');
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: user.username,
        password: 'testpassword',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.username).toBe(user.username);
  });

  it('should create new user with admin token', async () => {
    const admin = await createTestUser('admin');
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: admin.username,
        password: 'testpassword',
      });

    const token = loginResponse.body.data.token;

    // Create new user
    const response = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'newuser' + Date.now(),
        password: 'password123',
        role: 'staff',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.role).toBe('staff');
  });
});
