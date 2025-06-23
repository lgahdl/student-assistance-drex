import request from 'supertest';
import { createTestApp } from './testApp';
import { testPrisma, createTestUser, createTestStudent, createTestReceiver } from './setup';

const app = createTestApp();

describe('Receivers Endpoints', () => {
  let adminToken: string;
  let staffToken: string;
  let studentToken: string;

  beforeEach(async () => {
    const admin = await createTestUser('admin');
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: admin.username, password: 'testpassword' });
    adminToken = adminLogin.body.data.token;

    const staff = await createTestUser('staff');
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: staff.username, password: 'testpassword' });
    staffToken = staffLogin.body.data.token;

    const student = await createTestStudent();
    const studentLogin = await request(app)
      .post('/api/auth/student/wallet')
      .send({ walletAddress: student.walletAddress });
    studentToken = studentLogin.body.data.token;
  });

  describe('GET /api/receivers', () => {
    it('should list all receivers for admin', async () => {
      const receiver1 = await createTestReceiver();
      const receiver2 = await createTestReceiver();

      const response = await request(app)
        .get('/api/receivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should filter receivers by type', async () => {
      await testPrisma.receiver.create({
        data: {
          address: '0x1111111111111111111111111111111111111111',
          name: 'Student Receiver',
          type: 'student',
          verified: true,
        },
      });

      await testPrisma.receiver.create({
        data: {
          address: '0x2222222222222222222222222222222222222222',
          name: 'Establishment Receiver',
          type: 'establishment',
          verified: true,
        },
      });

      const response = await request(app)
        .get('/api/receivers?type=student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].type).toBe('student');
    });
  });

  describe('POST /api/receivers', () => {
    it('should create new receiver with staff authentication', async () => {
      const response = await request(app)
        .post('/api/receivers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          address: '0x1234567890123456789012345678901234567890',
          name: 'New Receiver',
          cpfCnpj: '12345678901',
          type: 'establishment',
          verified: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Receiver');
      expect(response.body.data.verified).toBe(true);
    });

    it('should create receiver for student with student authentication', async () => {
      const response = await request(app)
        .post('/api/receivers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          address: '0x1234567890123456789012345678901234567890',
          name: 'Student Receiver',
          cpfCnpj: '12345678901',
          type: 'establishment',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Student Receiver');
      expect(response.body.data.verified).toBe(false); // Students cannot set verified
    });

    it('should prevent duplicate addresses', async () => {
      const receiver = await createTestReceiver();

      const response = await request(app)
        .post('/api/receivers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          address: receiver.address,
          name: 'Duplicate Receiver',
          type: 'establishment',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Receiver with this address already exists');
    });
  });

  describe('GET /api/receivers/check/:address', () => {
    it('should check if receiver exists', async () => {
      const receiver = await createTestReceiver();

      const response = await request(app)
        .get(`/api/receivers/check/${receiver.address}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
      expect(response.body.data.receiver.address).toBe(receiver.address);
    });

    it('should return false for non-existent receiver', async () => {
      const response = await request(app)
        .get('/api/receivers/check/0x1234567890123456789012345678901234567890')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
      expect(response.body.data.receiver).toBeNull();
    });

    it('should validate address format', async () => {
      const response = await request(app)
        .get('/api/receivers/check/invalid-address')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid address format');
    });
  });
});
