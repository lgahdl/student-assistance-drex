import request from 'supertest';
import { createTestApp } from './testApp';
import { createTestUser, createTestStudent } from './setup';

const app = createTestApp();

describe('API Endpoints', () => {
  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Create admin user
      const admin = await createTestUser('admin');
      
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: admin.username,
          password: 'testpassword',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const token = loginResponse.body.data.token;

      // Get current user info
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.username).toBe(admin.username);

      // Create new user
      const createUserResponse = await request(app)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'newuser' + Date.now(),
          password: 'password123',
          role: 'staff',
        })
        .expect(201);

      expect(createUserResponse.body.success).toBe(true);
      expect(createUserResponse.body.data.role).toBe('staff');
    });
  });

  describe('Student Operations', () => {
    it('should handle student wallet authentication', async () => {
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
      expect(response.body.data.student.role).toBe('student');

      // Test /me endpoint for student
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response.body.data.token}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.walletAddress).toBe(student.walletAddress);
      expect(meResponse.body.data.role).toBe('student');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/auth/student/wallet')
        .send({
          walletAddress: 'invalid-address',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid wallet address format');
    });

    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});
