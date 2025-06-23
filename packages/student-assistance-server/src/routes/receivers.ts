import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { 
  validateBody, 
  validateQuery,
  createReceiverSchema,
  updateReceiverSchema,
  paginationSchema
} from '../utils/validation';
import { 
  authenticateToken, 
  requireStaff,
  requireStudentOrStaff, 
  AuthenticatedRequest 
} from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/receivers - List receivers with pagination and filters
router.get('/', 
  validateQuery(paginationSchema.extend({
    search: z.string().optional(),
    type: z.enum(['student', 'establishment', 'other']).optional(),
    verified: z.enum(['true', 'false']).transform((val: string) => val === 'true').optional(),
    registeredBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page, limit, search, type, verified, registeredBy } = req.query as any;
      const offset = (page - 1) * limit;

      const where: any = {};
      
      // If student, only show receivers they registered
      if (req.student) {
        where.registeredBy = req.student.walletAddress;
      } else if (registeredBy) {
        where.registeredBy = registeredBy;
      }

      if (type) {
        where.type = type;
      }
      if (verified !== undefined) {
        where.verified = verified;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search } },
        ];
      }

      const [receivers, total] = await Promise.all([
        prisma.receiver.findMany({
          where,
          include: {
            expenseTypes: {
              include: {
                expenseType: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.receiver.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          receivers: receivers.map((receiver: any) => ({
            ...receiver,
            expenseTypes: receiver.expenseTypes.map((et: any) => ({
              ...et.expenseType,
              id: et.expenseType.id.toString(),
            })),
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/receivers/:address - Get receiver by address
router.get('/:address', requireStudentOrStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const address = req.params.address;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new AppError('Invalid address format', 400);
    }

    const receiver = await prisma.receiver.findUnique({
      where: { address },
      include: {
        expenseTypes: {
          include: {
            expenseType: true,
          },
        },
      },
    });

    if (!receiver) {
      throw new AppError('Receiver not found', 404);
    }

    // If student, check if they registered this receiver (temporarily disabled until schema is updated)
    // if (req.student && receiver.registeredBy !== req.student.walletAddress) {
    //   throw new AppError('Access denied', 403);
    // }

    res.json({
      success: true,
      data: {
        ...receiver,
        expenseTypes: (receiver as any).expenseTypes.map((et: any) => ({
          ...et.expenseType,
          id: et.expenseType.id.toString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/receivers/check/:address - Check if receiver exists
router.get('/check/:address', async (req: AuthenticatedRequest, res, next) => {
  try {
    const addressValue = req.params.address;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(addressValue)) {
      throw new AppError('Invalid address format', 400);
    }

    const receiver = await prisma.receiver.findUnique({
      where: { address: addressValue },
    });

    res.json({
      success: true,
      data: {
        exists: !!receiver,
        receiver: receiver ? {
          ...receiver,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/receivers - Create new receiver
router.post('/', 
  requireStudentOrStaff,
  validateBody(createReceiverSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { address, name, cpfCnpj, type, verified = false, registeredBy } = req.body;

      // Check if receiver already exists
      const existingReceiver = await prisma.receiver.findUnique({
        where: { address },
      });

      if (existingReceiver) {
        throw new AppError('Receiver with this address already exists', 409);
      }

      // Determine who registered this receiver
      let finalRegisteredBy = registeredBy;
      if (req.student) {
        // Students can only register receivers for themselves
        finalRegisteredBy = req.student.walletAddress;
      } else if (req.user && !registeredBy) {
        // Staff/admin can create without registeredBy (global receivers)
        finalRegisteredBy = null;
      }

      const receiver = await prisma.receiver.create({
        data: {
          address,
          name,
          cpfCnpj,
          type,
          verified: req.user ? verified : false, // Only staff/admin can set verified
          registeredBy: finalRegisteredBy,
        },
      });

      const loggedBy = req.student ? `student ${req.student.name}` : `user ${req.user!.username}`;
      logger.info(`Receiver ${address} created by ${loggedBy}`);

      res.status(201).json({
        success: true,
        data: receiver,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/receivers/:address - Update receiver
router.put('/:address', 
  requireStudentOrStaff,
  validateBody(updateReceiverSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const address = req.params.address;

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new AppError('Invalid address format', 400);
      }

      // Check if receiver exists
      const existingReceiver = await prisma.receiver.findUnique({
        where: { address },
      });

      if (!existingReceiver) {
        throw new AppError('Receiver not found', 404);
      }

      // If student, check if they registered this receiver (temporarily disabled until schema is updated)
      // if (req.student && existingReceiver.registeredBy !== req.student.walletAddress) {
      //   throw new AppError('Access denied', 403);
      // }

      // Students cannot update verified status or registeredBy
      const updateData = { ...req.body };
      if (req.student) {
        delete updateData.verified;
        delete updateData.registeredBy;
      }

      const receiver = await prisma.receiver.update({
        where: { address },
        data: updateData,
      });

      const loggedBy = req.student ? `student ${req.student.name}` : `user ${req.user!.username}`;
      logger.info(`Receiver ${address} updated by ${loggedBy}`);

      res.json({
        success: true,
        data: receiver,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/receivers/:address/verify - Toggle receiver verification
router.put('/:address/verify', requireStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const address = req.params.address;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new AppError('Invalid address format', 400);
    }

    const currentReceiver = await prisma.receiver.findUnique({
      where: { address },
      select: { address: true, verified: true },
    });

    if (!currentReceiver) {
      throw new AppError('Receiver not found', 404);
    }

    const receiver = await prisma.receiver.update({
      where: { address },
      data: { verified: !currentReceiver.verified },
    });

    logger.info(`Receiver ${receiver.address} ${receiver.verified ? 'verified' : 'unverified'} by ${req.user!.username}`);

    res.json({
      success: true,
      data: {
        ...receiver,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/receivers/:address - Delete receiver
router.delete('/:address', requireStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const address = req.params.address;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new AppError('Invalid address format', 400);
    }

    const receiver = await prisma.receiver.delete({
      where: { address },
    });

    logger.info(`Receiver ${address} deleted by ${req.user!.username}`);

    res.json({
      success: true,
      data: receiver,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 