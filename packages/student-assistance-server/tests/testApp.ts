import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from '../src/middleware/errorHandler';
import { notFoundHandler } from '../src/middleware/notFoundHandler';

// Routes
import authRoutes from '../src/routes/auth';
import studentRoutes from '../src/routes/students';
import studentApiRoutes from '../src/routes/student';
import expenseTypeRoutes from '../src/routes/expense-types';
import transactionRoutes from '../src/routes/transactions';
import receiverRoutes from '../src/routes/receivers';
import healthRoutes from '../src/routes/health';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export function createTestApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: true, // Allow all origins in tests
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.use('/health', healthRoutes);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/student', studentApiRoutes);
  app.use('/api/expense-types', expenseTypeRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/receivers', receiverRoutes);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
} 