import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Test database setup
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await testPrisma.$connect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up database in reverse order of dependencies
  try {
    await testPrisma.receiverExpenseType.deleteMany();
    await testPrisma.spendingLimit.deleteMany();
    await testPrisma.transaction.deleteMany();
    await testPrisma.receiver.deleteMany();
    await testPrisma.student.deleteMany();
    await testPrisma.expenseType.deleteMany();
    await testPrisma.user.deleteMany();
  } catch (error) {
    console.warn('Error during test cleanup:', error);
  }
});

// Global test cleanup
afterAll(async () => {
  await testPrisma.$disconnect();
});

// Test utilities
export const createTestUser = async (role: 'admin' | 'staff' = 'admin') => {
  const passwordHash = await bcrypt.hash('testpassword', 12);
  const username = `test${role}${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  return await testPrisma.user.create({
    data: {
      username,
      passwordHash,
      role,
    },
  });
};

export const createTestStudent = async () => {
  const randomHex = () => Math.random().toString(16).substr(2, 8);
  const walletAddress = `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
  const cpf = `${Math.floor(Math.random() * 89999999999) + 10000000000}`;
  
  return await testPrisma.student.create({
    data: {
      walletAddress,
      name: 'Test Student',
      cpf,
      university: 'Test University',
      course: 'Test Course',
      monthlyAmount: 500.00,
    },
  });
};

export const createTestExpenseType = async () => {
  return await testPrisma.expenseType.create({
    data: {
      name: `Test Expense ${Date.now()}`,
      description: 'Test expense type',
      category: 'Test Category',
    },
  });
};

export const createTestReceiver = async () => {
  const randomHex = () => Math.random().toString(16).substr(2, 8);
  const address = `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
  
  return await testPrisma.receiver.create({
    data: {
      address,
      name: 'Test Receiver',
      cpfCnpj: '12345678901',
      type: 'establishment',
      verified: true,
    },
  });
}; 