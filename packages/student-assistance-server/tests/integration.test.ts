import request from 'supertest';
import { createTestApp } from './testApp';
import { testPrisma, createTestUser, createTestStudent } from './setup';

const app = createTestApp();

describe('Integration Tests', () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Create admin user and get token
    const admin = await createTestUser('admin');
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: admin.username, password: 'testpassword' });
    adminToken = adminLogin.body.data.token;

    // Create staff user and get token
    const staff = await createTestUser('staff');
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: staff.username, password: 'testpassword' });
    staffToken = staffLogin.body.data.token;
  });

  describe('User Management', () => {
    it('should create and manage users', async () => {
      // Create user
      const createResponse = await request(app)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser' + Date.now(),
          password: 'password123',
          role: 'staff',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.role).toBe('staff');

      // List users
      const listResponse = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(Array.isArray(listResponse.body.data)).toBe(true);
      expect(listResponse.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Student Management', () => {
    it('should create and manage students', async () => {
      const randomHex = () => Math.random().toString(16).substr(2, 8);
      const walletAddress = `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
      const cpf = `${Math.floor(Math.random() * 89999999999) + 10000000000}`;

      // Create student
      const createResponse = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          walletAddress,
          name: 'Test Student',
          cpf,
          university: 'UFSC',
          course: 'Computer Science',
          monthlyAmount: 500,
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.walletAddress).toBe(walletAddress);

      // Get student
      const getResponse = await request(app)
        .get(`/api/students/${walletAddress}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('Test Student');

      // Update student
      const updateResponse = await request(app)
        .put(`/api/students/${walletAddress}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Updated Student Name',
          monthlyAmount: 600,
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Student Name');

      // List students
      const listResponse = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(1);
    });

    it('should authenticate student with wallet', async () => {
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
  });

  describe('Receiver Management', () => {
    it('should create and manage receivers', async () => {
      const randomHex = () => Math.random().toString(16).substr(2, 8);
      const address = `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;

      // Create receiver
      const createResponse = await request(app)
        .post('/api/receivers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          address,
          name: 'Test Receiver',
          cpfCnpj: '12345678901',
          type: 'establishment',
          verified: true,
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.address).toBe(address);

      // Check if receiver exists
      const checkResponse = await request(app)
        .get(`/api/receivers/check/${address}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(checkResponse.body.success).toBe(true);
      expect(checkResponse.body.data.exists).toBe(true);

      // List receivers
      const listResponse = await request(app)
        .get('/api/receivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(1);
    });
  });

  describe('Expense Types', () => {
    it('should create and manage expense types', async () => {
      // Create expense type
      const createResponse = await request(app)
        .post('/api/expense-types')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Test Expense',
          description: 'Test expense type',
          category: 'Test Category',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe('Test Expense');

      // List expense types
      const listResponse = await request(app)
        .get('/api/expense-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(Array.isArray(listResponse.body.data)).toBe(true);
    });
  });
});
