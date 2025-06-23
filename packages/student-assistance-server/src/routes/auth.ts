import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { 
  validateBody, 
  loginSchema, 
  createUserSchema 
} from '../utils/validation';
import { 
  authenticateToken, 
  requireAdmin, 
  AuthenticatedRequest 
} from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router: Router = Router();

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logger.info(`User ${username} logged in successfully`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id.toString(),
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/student/wallet - Student authentication with wallet address
router.post('/student/wallet', async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      throw new AppError('Wallet address is required', 400);
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new AppError('Invalid wallet address format', 400);
    }

    // Find student by wallet address
    const student = await prisma.student.findFirst({
      where: { 
        walletAddress: {
          equals: walletAddress,
          mode: 'insensitive'
        }
      },
      select: {
        walletAddress: true,
        name: true,
        cpf: true,
        university: true,
        course: true,
        monthlyAmount: true,
        active: true,
      },
    });

    if (!student || !student.active) {
      throw new AppError('Student not found or inactive', 404);
    }

    // Generate JWT token for student
    const token = jwt.sign(
      { 
        walletAddress: student.walletAddress, 
        name: student.name, 
        role: 'student' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    logger.info(`Student ${student.name} (${walletAddress}) authenticated successfully`);

    res.json({
      success: true,
      data: {
        token,
        student: {
          walletAddress: student.walletAddress,
          name: student.name,
          university: student.university,
          course: student.course,
          monthlyAmount: student.monthlyAmount.toString(),
          role: 'student',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.student) {
      // Student user
      const student = await prisma.student.findUnique({
        where: { walletAddress: req.student.walletAddress },
        select: {
          walletAddress: true,
          name: true,
          cpf: true,
          university: true,
          course: true,
          monthlyAmount: true,
          active: true,
          createdAt: true,
        },
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      res.json({
        success: true,
        data: {
          ...student,
          monthlyAmount: student.monthlyAmount.toString(),
          role: 'student',
        },
      });
    } else if (req.user) {
      // Admin/Staff user
      const user = await prisma.user.findUnique({
        where: { id: BigInt(req.user.id) },
        select: {
          id: true,
          username: true,
          role: true,
          active: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: {
          ...user,
          id: user.id.toString(),
        },
      });
    } else {
      throw new AppError('Authentication required', 401);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/users - Create new user (admin only)
router.post('/users', 
  authenticateToken, 
  requireAdmin, 
  validateBody(createUserSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { username, password, role } = req.body;

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
          role,
        },
        select: {
          id: true,
          username: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

      logger.info(`User ${username} created by ${req.user!.username}`);

      res.status(201).json({
        success: true,
        data: {
          ...user,
          id: user.id.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/users - List all users (admin only)
router.get('/users', 
  authenticateToken, 
  requireAdmin, 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          active: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: users.map((user: any) => ({
          ...user,
          id: user.id.toString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/users/:id/toggle - Toggle user active status (admin only)
router.put('/users/:id/toggle', 
  authenticateToken, 
  requireAdmin, 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = BigInt(req.params.id);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, active: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { active: !user.active },
        select: {
          id: true,
          username: true,
          role: true,
          active: true,
        },
      });

      logger.info(`User ${user.username} ${updatedUser.active ? 'activated' : 'deactivated'} by ${req.user!.username}`);

      res.json({
        success: true,
        data: {
          ...updatedUser,
          id: updatedUser.id.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // Here we just log the action
  logger.info(`User ${req.user!.username} logged out`);
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router; 