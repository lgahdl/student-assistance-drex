import { Router } from 'express';
import { prisma } from '../database/client';

const router: Router = Router();

// GET /health - Basic health check
router.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'student-assistance-server',
  });
});

// GET /health/detailed - Detailed health check with database status
router.get('/detailed', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get some basic stats
    const [studentCount, userCount, transactionCount] = await Promise.all([
      prisma.student.count(),
      prisma.user.count(),
      prisma.transaction.count(),
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'student-assistance-server',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        stats: {
          students: studentCount,
          users: userCount,
          transactions: transactionCount,
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'student-assistance-server',
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router; 