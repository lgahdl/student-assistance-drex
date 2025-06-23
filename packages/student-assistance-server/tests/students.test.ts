import request from 'supertest';
import { createTestApp } from './testApp';
import { testPrisma, createTestUser, createTestStudent, createTestExpenseType } from './setup';

const app = createTestApp();

describe('Students Endpoints', () => {
  let adminToken: string;
  let staffToken: string;

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
  });

  describe('GET /api/students', () => {
    it('should list all students for admin', async () => {
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter students by university', async () => {
      await testPrisma.student.create({
        data: {
          walletAddress: '0x1111111111111111111111111111111111111111',
          name: 'Student UFSC',
          cpf: '11111111111',
          university: 'UFSC',
          course: 'Engineering',
          monthlyAmount: 500,
        },
      });

      await testPrisma.student.create({
        data: {
          walletAddress: '0x2222222222222222222222222222222222222222',
          name: 'Student USP',
          cpf: '22222222222',
          university: 'USP',
          course: 'Medicine',
          monthlyAmount: 600,
        },
      });

      const response = await request(app)
        .get('/api/students?university=UFSC')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].university).toBe('UFSC');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/students')
        .expect(401);
    });
  });

  describe('POST /api/students', () => {
    it('should create new student with staff authentication', async () => {
      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          name: 'New Student',
          cpf: '12345678901',
          university: 'UFSC',
          course: 'Computer Science',
          monthlyAmount: 500,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Student');
      expect(response.body.data.walletAddress).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should prevent duplicate wallet addresses', async () => {
      const student = await createTestStudent();

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          walletAddress: student.walletAddress,
          name: 'Duplicate Student',
          cpf: '99999999999',
          university: 'UFSC',
          course: 'Computer Science',
          monthlyAmount: 500,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Student with this wallet address already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Incomplete Student',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/students/:walletAddress', () => {
    it('should get student by wallet address', async () => {
      const student = await createTestStudent();

      const response = await request(app)
        .get(`/api/students/${student.walletAddress}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.walletAddress).toBe(student.walletAddress);
      expect(response.body.data.name).toBe(student.name);
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .get('/api/students/0x1234567890123456789012345678901234567890')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Student not found');
    });
  });

  describe('PUT /api/students/:walletAddress', () => {
    it('should update student information', async () => {
      const student = await createTestStudent();

      const response = await request(app)
        .put(`/api/students/${student.walletAddress}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Updated Student Name',
          monthlyAmount: 600,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Student Name');
      expect(response.body.data.monthlyAmount).toBe('600');
    });
  });

  describe('DELETE /api/students/:walletAddress', () => {
    it('should delete student', async () => {
      const student = await createTestStudent();

      const response = await request(app)
        .delete(`/api/students/${student.walletAddress}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify student was deleted
      const deletedStudent = await testPrisma.student.findUnique({
        where: { walletAddress: student.walletAddress },
      });
      expect(deletedStudent).toBeNull();
    });
  });

  describe('PUT /api/students/:walletAddress/toggle-active', () => {
    it('should toggle student active status', async () => {
      const student = await createTestStudent();
      expect(student.active).toBe(true);

      const response = await request(app)
        .put(`/api/students/${student.walletAddress}/toggle-active`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.active).toBe(false);
    });
  });
});
