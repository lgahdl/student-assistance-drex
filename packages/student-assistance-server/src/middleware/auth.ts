import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
  student?: {
    walletAddress: string;
    name: string;
    role: 'student';
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if it's a student token
    if (decoded.role === 'student' && decoded.walletAddress) {
      // Verify student still exists and is active
      const student = await prisma.student.findUnique({
        where: { walletAddress: decoded.walletAddress },
        select: { walletAddress: true, name: true, active: true }
      });

      if (!student || !student.active) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.student = {
        walletAddress: student.walletAddress,
        name: student.name,
        role: 'student'
      };
    } else {
      // Verify admin/staff user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.userId) },
        select: { id: true, username: true, role: true, active: true }
      });

      if (!user || !user.active) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = {
        id: user.id.toString(),
        username: user.username,
        role: user.role
      };
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || req.student?.role;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = requireRole(['admin']);
export const requireStaff = requireRole(['admin', 'staff']);
export const requireStudent = requireRole(['student']);
export const requireStudentOrStaff = requireRole(['student', 'admin', 'staff']); 