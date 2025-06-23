import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from './testApp';
import { testPrisma, createTestUser, createTestStudent } from './setup';

const app = createTestApp();

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
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
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: user.username,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/student/wallet', () => {
    it('should authenticate student with valid wallet address', async () => {
      const student = await createTestStudent();
      
      const response = await request(app)
        .post('/api/auth/student/wallet')
        .send({
          walletAddress: student.walletAddress,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.student.walletAddress).toBe(student.walletAddress);
    });

    it('should reject invalid wallet address format', async () => {
      const response = await request(app)
        .post('/api/auth/student/wallet')
        .send({
          walletAddress: 'invalid-address',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid wallet address format');
    });
  });

  describe('POST /api/auth/users', () => {
    it('should create new user with admin authentication', async () => {
      const admin = await createTestUser('admin');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: admin.username,
          password: 'testpassword',
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'staff',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('newuser');
      expect(response.body.data.role).toBe('staff');
    });

    it('should reject user creation without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/users')
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'staff',
        })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});
