import { Router } from 'express';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { 
  validateBody, 
  validateQuery,
  createExpenseTypeSchema, 
  updateExpenseTypeSchema,
  paginationSchema
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

// GET /api/expense-types - List all expense types
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { active } = req.query;
    
    const where: any = {};
    if (active === 'true') {
      where.active = true;
    } else if (active === 'false') {
      where.active = false;
    }

    const expenseTypes = await prisma.expenseType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: expenseTypes.map(type => ({
        ...type,
        id: type.id.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/expense-types/:id - Get expense type by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const expenseTypeId = BigInt(req.params.id);

    const expenseType = await prisma.expenseType.findUnique({
      where: { id: expenseTypeId },
      include: {
        _count: {
          select: {
            spendingLimits: true,
            transactions: true,
          },
        },
      },
    });

    if (!expenseType) {
      throw new AppError('Expense type not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...expenseType,
        id: expenseType.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/expense-types - Create new expense type
router.post('/', 
  requireStaff,
  validateBody(createExpenseTypeSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { name, description, category } = req.body;

      const expenseType = await prisma.expenseType.create({
        data: {
          name,
          description,
          category,
        },
      });

      logger.info(`Expense type '${name}' created by ${req.user!.username}`);

      res.status(201).json({
        success: true,
        data: {
          ...expenseType,
          id: expenseType.id.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/expense-types/:id - Update expense type
router.put('/:id', 
  requireStaff,
  validateBody(updateExpenseTypeSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const expenseTypeId = BigInt(req.params.id);

      const expenseType = await prisma.expenseType.update({
        where: { id: expenseTypeId },
        data: req.body,
      });

      logger.info(`Expense type '${expenseType.name}' updated by ${req.user!.username}`);

      res.json({
        success: true,
        data: {
          ...expenseType,
          id: expenseType.id.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/expense-types/:id - Soft delete expense type (set active = false)
router.delete('/:id', requireStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const expenseTypeId = BigInt(req.params.id);

    // Check if expense type is being used
    const usage = await prisma.expenseType.findUnique({
      where: { id: expenseTypeId },
      include: {
        _count: {
          select: {
            spendingLimits: true,
            transactions: true,
          },
        },
      },
    });

    if (!usage) {
      throw new AppError('Expense type not found', 404);
    }

    if (usage._count.spendingLimits > 0 || usage._count.transactions > 0) {
      // Soft delete if being used
      const expenseType = await prisma.expenseType.update({
        where: { id: expenseTypeId },
        data: { active: false },
      });

      logger.info(`Expense type '${expenseType.name}' deactivated by ${req.user!.username}`);

      res.json({
        success: true,
        message: 'Expense type deactivated (cannot be deleted as it has associated records)',
        data: {
          ...expenseType,
          id: expenseType.id.toString(),
        },
      });
    } else {
      // Hard delete if not being used
      const expenseType = await prisma.expenseType.delete({
        where: { id: expenseTypeId },
      });

      logger.info(`Expense type '${expenseType.name}' deleted by ${req.user!.username}`);

      res.json({
        success: true,
        message: 'Expense type deleted successfully',
        data: {
          ...expenseType,
          id: expenseType.id.toString(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// PUT /api/expense-types/:id/activate - Reactivate expense type
router.put('/:id/activate', requireStaff, async (req: AuthenticatedRequest, res, next) => {
  try {
    const expenseTypeId = BigInt(req.params.id);

    const expenseType = await prisma.expenseType.update({
      where: { id: expenseTypeId },
      data: { active: true },
    });

    logger.info(`Expense type '${expenseType.name}' activated by ${req.user!.username}`);

    res.json({
      success: true,
      data: {
        ...expenseType,
        id: expenseType.id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/expense-types/categories - Get all categories
router.get('/meta/categories', async (req: AuthenticatedRequest, res, next) => {
  try {
    const categories = await prisma.expenseType.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json({
      success: true,
      data: categories.map(item => item.category),
    });
  } catch (error) {
    next(error);
  }
});

export default router; 