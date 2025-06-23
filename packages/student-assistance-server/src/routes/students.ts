import { Router } from 'express';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { 
  validateBody, 
  validateQuery,
  createStudentSchema, 
  updateStudentSchema,
  studentQuerySchema
} from '../utils/validation';
import { 
  authenticateToken, 
  requireStaff, 
  AuthenticatedRequest 
} from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/students - List students with pagination and filters
router.get('/', 
  validateQuery(studentQuerySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page, limit, search, active } = req.query as any;
      const offset = (page - 1) * limit;

      const where: any = {};
      if (active !== undefined) {
        where.active = active;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { walletAddress: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          include: {
            spendingLimits: {
              include: {
                expenseType: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.student.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          students: students.map(student => ({
            ...student,
            monthlyAmount: student.monthlyAmount.toString(),
            spendingLimits: student.spendingLimits.map(limit => ({
              ...limit,
              id: limit.id.toString(),
              expenseTypeId: limit.expenseTypeId.toString(),
              limitValue: limit.limitValue.toString(),
              expenseType: {
                ...limit.expenseType,
                id: limit.expenseType.id.toString(),
              },
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

// GET /api/students/:walletAddress - Get student by wallet address
router.get('/:walletAddress', async (req: AuthenticatedRequest, res, next) => {
  try {
    const walletAddress = req.params.walletAddress;

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new AppError('Invalid wallet address format', 400);
    }

    const student = await prisma.student.findUnique({
      where: { walletAddress },
      include: {
        spendingLimits: {
          include: {
            expenseType: true,
          },
        },
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
        spendingLimits: student.spendingLimits.map(limit => ({
          ...limit,
          id: limit.id.toString(),
          expenseTypeId: limit.expenseTypeId.toString(),
          limitValue: limit.limitValue.toString(),
          expenseType: {
            ...limit.expenseType,
            id: limit.expenseType.id.toString(),
          },
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/students - Create new student
router.post('/', 
  requireStaff,
  validateBody(createStudentSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { 
        walletAddress, 
        name, 
        cpf, 
        university, 
        course,
        monthlyAmount, 
        spendingLimits = [] 
      } = req.body;

      // Check if student already exists
      const existingStudent = await prisma.student.findUnique({
        where: { walletAddress },
      });

      if (existingStudent) {
        throw new AppError('Student with this wallet address already exists', 409);
      }

      // Check if CPF already exists
      const existingCpf = await prisma.student.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        throw new AppError('Student with this CPF already exists', 409);
      }

      // Validate expense type IDs if spending limits provided
      if (spendingLimits.length > 0) {
        const expenseTypeIds = spendingLimits.map((limit: any) => limit.expenseTypeId);
        const existingExpenseTypes = await prisma.expenseType.findMany({
          where: { id: { in: expenseTypeIds.map((id: any) => BigInt(id)) } },
        });

        if (existingExpenseTypes.length !== expenseTypeIds.length) {
          throw new AppError('One or more expense types not found', 400);
        }
      }

      // Create student with spending limits in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the student
        const student = await tx.student.create({
          data: {
            walletAddress,
            name,
            cpf,
            university,
            course,
            monthlyAmount,
          },
        });

        // Create spending limits if provided
        if (spendingLimits.length > 0) {
          await tx.spendingLimit.createMany({
            data: spendingLimits.map((limit: any) => ({
              studentAddress: student.walletAddress,
              expenseTypeId: BigInt(limit.expenseTypeId),
              limitValue: limit.limitValue,
              limitType: limit.limitType,
            })),
          });
        }

        return student;
      });

      logger.info(`Student ${name} created by ${req.user!.username}`);

      res.status(201).json({
        success: true,
        data: {
          ...result,
          monthlyAmount: result.monthlyAmount.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/students/:walletAddress - Update student
router.put('/:walletAddress', 
  requireStaff,
  validateBody(updateStudentSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const walletAddress = req.params.walletAddress;

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        throw new AppError('Invalid wallet address format', 400);
      }

      const student = await prisma.student.update({
        where: { walletAddress },
        data: req.body,
      });

      logger.info(`Student ${student.name} updated by ${req.user!.username}`);

      res.json({
        success: true,
        data: {
          ...student,
          monthlyAmount: student.monthlyAmount.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/students/:walletAddress - Delete student
router.delete('/:walletAddress', requireStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const walletAddress = req.params.walletAddress;

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new AppError('Invalid wallet address format', 400);
    }

    const student = await prisma.student.delete({
      where: { walletAddress },
    });

    logger.info(`Student ${student.name} deleted by ${req.user!.username}`);

    res.json({
      success: true,
      data: {
        ...student,
        monthlyAmount: student.monthlyAmount.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/students/:walletAddress/toggle-active - Toggle student active status
router.put('/:walletAddress/toggle-active', requireStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const walletAddress = req.params.walletAddress;

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new AppError('Invalid wallet address format', 400);
    }

    const currentStudent = await prisma.student.findUnique({
      where: { walletAddress },
      select: { walletAddress: true, name: true, active: true },
    });

    if (!currentStudent) {
      throw new AppError('Student not found', 404);
    }

    const student = await prisma.student.update({
      where: { walletAddress },
      data: { active: !currentStudent.active },
    });

    logger.info(`Student ${student.name} ${student.active ? 'activated' : 'deactivated'} by ${req.user!.username}`);

    res.json({
      success: true,
      data: {
        ...student,
        monthlyAmount: student.monthlyAmount.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 