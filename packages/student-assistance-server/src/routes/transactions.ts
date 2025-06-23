import { Router } from 'express';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { 
  validateBody, 
  validateQuery,
  updateTransactionSchema,
  transactionQuerySchema
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

// GET /api/transactions - List transactions with pagination and filters
router.get('/', 
  validateQuery(transactionQuerySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page, limit, fromAddress, toAddress, isUnknownDestiny } = req.query as any;
      const offset = (page - 1) * limit;

      const where: any = {};
      
      // If student, only show transactions related to their wallet
      if (req.student) {
        where.OR = [
          { fromAddress: req.student.walletAddress },
          { toAddress: req.student.walletAddress },
          { studentAddress: req.student.walletAddress }
        ];
      } else {
        // Staff/admin can filter by addresses
        if (fromAddress) {
          where.fromAddress = fromAddress;
        }
        if (toAddress) {
          where.toAddress = toAddress;
        }
      }

      if (isUnknownDestiny !== undefined) {
        where.isUnknownDestiny = isUnknownDestiny;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            student: {
              select: {
                name: true,
                walletAddress: true,
              },
            },
            receiver: {
              select: {
                name: true,
                address: true,
                type: true,
              },
            },
            expenseType: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          transactions: transactions.map(transaction => ({
            ...transaction,
            amount: transaction.amount.toString(),
            blockNumber: transaction.blockNumber.toString(),
            expenseType: transaction.expenseType ? {
              ...transaction.expenseType,
              id: transaction.expenseType.id.toString(),
            } : null,
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

// GET /api/transactions/:txHash - Get transaction by hash
router.get('/:txHash', async (req: AuthenticatedRequest, res, next) => {
  try {
    const txHash = req.params.txHash;

    const transaction = await prisma.transaction.findUnique({
      where: { txHash },
      include: {
        student: true,
        receiver: true,
        expenseType: true,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...transaction,
        amount: transaction.amount.toString(),
        blockNumber: transaction.blockNumber.toString(),
        expenseType: transaction.expenseType ? {
          ...transaction.expenseType,
          id: transaction.expenseType.id.toString(),
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/student/:address - Get transactions for a specific student
router.get('/student/:address', 
  validateQuery(transactionQuerySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const studentAddress = req.params.address;
      const { page, limit } = req.query as any;
      const offset = (page - 1) * limit;

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(studentAddress)) {
        throw new AppError('Invalid wallet address format', 400);
      }

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { walletAddress: studentAddress },
        select: { walletAddress: true, name: true },
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { studentAddress },
          include: {
            student: true,
            receiver: true,
            expenseType: true,
          },
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.transaction.count({ 
          where: { studentAddress }
        }),
      ]);

      res.json({
        success: true,
        data: {
          student,
          transactions: transactions.map(tx => ({
            ...tx,
            amount: tx.amount.toString(),
            blockNumber: tx.blockNumber.toString(),
            expenseType: tx.expenseType ? {
              ...tx.expenseType,
              id: tx.expenseType.id.toString(),
            } : null,
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

// PUT /api/transactions/:txHash - Update transaction metadata
router.put('/:txHash', 
  validateBody(updateTransactionSchema), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const txHash = req.params.txHash;
      const { studentAddress, receiverAddress, expenseTypeId } = req.body;

      // Build update data
      const updateData: any = {};
      
      if (studentAddress !== undefined) {
        updateData.studentAddress = studentAddress;
      }
      
      if (receiverAddress !== undefined) {
        updateData.receiverAddress = receiverAddress;
      }
      
      if (expenseTypeId !== undefined) {
        updateData.expenseTypeId = expenseTypeId ? BigInt(expenseTypeId) : null;
      }

      // If any assignment is provided, mark as not unknown
      if (studentAddress || receiverAddress || expenseTypeId) {
        updateData.isUnknownDestiny = false;
      }

      const transaction = await prisma.transaction.update({
        where: { txHash },
        data: updateData,
        include: {
          student: true,
          receiver: true,
          expenseType: true,
        },
      });

      logger.info(`Transaction ${txHash} updated by ${req.user!.username}`);

      res.json({
        success: true,
        data: {
          ...transaction,
          amount: transaction.amount.toString(),
          blockNumber: transaction.blockNumber.toString(),
          expenseType: transaction.expenseType ? {
            ...transaction.expenseType,
            id: transaction.expenseType.id.toString(),
          } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/transactions/stats/summary - Get transaction statistics
router.get('/stats/summary', async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      totalTransactions,
      unknownDestinyCount,
      totalAmount,
      expenseTypeStats
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { isUnknownDestiny: true } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['expenseTypeId'],
        where: { expenseTypeId: { not: null } },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    // Get expense type details for stats
    const expenseTypes = await prisma.expenseType.findMany({
      where: {
        id: {
          in: expenseTypeStats.map(stat => stat.expenseTypeId!),
        },
      },
    });

    const enrichedExpenseStats = expenseTypeStats.map(stat => {
      const expenseType = expenseTypes.find(et => et.id === stat.expenseTypeId);
      return {
        expenseType: expenseType ? {
          ...expenseType,
          id: expenseType.id.toString(),
        } : null,
        count: stat._count,
        totalAmount: stat._sum.amount?.toString() || '0',
      };
    });

    res.json({
      success: true,
      data: {
        totalTransactions,
        unknownDestinyCount,
        totalAmount: totalAmount._sum?.amount?.toString() || '0',
        expenseTypeStats: enrichedExpenseStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions/bulk-create - Create transactions (for indexer use)
router.post('/bulk-create', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      throw new AppError('Transactions must be an array', 400);
    }

    // Process transactions to find matching students and receivers
    const processedTransactions = await Promise.all(
      transactions.map(async (tx: any) => {
        const [student, receiver] = await Promise.all([
          prisma.student.findUnique({
            where: { walletAddress: tx.fromAddress },
            select: { walletAddress: true },
          }),
          prisma.receiver.findUnique({
            where: { address: tx.toAddress },
            select: { address: true },
          }),
        ]);

        return {
          txHash: tx.txHash,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          amount: tx.amount,
          timestamp: new Date(tx.timestamp),
          blockNumber: BigInt(tx.blockNumber),
          studentAddress: student?.walletAddress || null,
          receiverAddress: receiver?.address || null,
          isUnknownDestiny: tx.isUnknownDestiny ?? (!student || !receiver),
        };
      })
    );

    const createdTransactions = await prisma.transaction.createMany({
      data: processedTransactions,
      skipDuplicates: true,
    });

    logger.info(`${createdTransactions.count} transactions bulk created by ${req.user!.username}`);

    res.status(201).json({
      success: true,
      data: {
        created: createdTransactions.count,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 