import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { 
  authenticateToken, 
  requireStudent, 
  AuthenticatedRequest 
} from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { indexerService } from '../services/indexerService';

const router: Router = Router();

// All routes require student authentication
router.use(authenticateToken);
router.use(requireStudent);

// GET /api/student/transfers - Get paginated transfer history for the authenticated student
router.get('/transfers', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.student) {
      throw new AppError('Student authentication required', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const studentAddress = req.student.walletAddress;

    // Try to get transfers from indexer first
    const indexerAvailable = await indexerService.isIndexerAvailable();
    let transfers: any[] = [];
    let total = 0;

    if (indexerAvailable) {
      logger.info('Fetching transfers from indexer for student:', studentAddress);
      
      const indexerResult = await indexerService.getTransfersByAddress(
        studentAddress, 
        page, 
        limit
      );

      // Get receiver information for all addresses in the transfers
      const receiverAddresses = [
        ...new Set([
          ...indexerResult.transfers.map(t => t.to.toLowerCase()),
          ...indexerResult.transfers.map(t => t.from.toLowerCase())
        ])
      ];

      const receivers = await prisma.receiver.findMany({
        where: {
          address: { in: receiverAddresses }
        },
        select: {
          address: true,
          name: true,
          type: true,
          verified: true,
          cpfCnpj: true
        }
      });

      const receiverMap = new Map(receivers.map(r => [r.address, r]));

      // Merge indexer data with receiver information
      transfers = indexerResult.transfers.map(transfer => {
        const receiverAddress = transfer.from.toLowerCase() === studentAddress.toLowerCase() 
          ? transfer.to.toLowerCase() 
          : transfer.from.toLowerCase();
          
        const receiver = receiverMap.get(receiverAddress);

        return {
          txHash: transfer.transactionHash,
          from: transfer.from,
          to: transfer.to,
          amount: transfer.amount,
          timestamp: new Date(transfer.timestamp * 1000), // Convert from unix timestamp
          blockNumber: transfer.blockNumber.toString(),
          receiver: receiver ? {
            address: receiver.address,
            name: receiver.name,
            type: receiver.type,
            verified: receiver.verified,
            cpfCnpj: receiver.cpfCnpj
          } : {
            address: receiverAddress,
            name: null,
            type: 'unknown',
            verified: false,
            cpfCnpj: null
          },
          expenseType: null, // TODO: Add expense type classification
          direction: transfer.from.toLowerCase() === studentAddress.toLowerCase() ? 'outgoing' : 'incoming'
        };
      });

      total = indexerResult.total;

    } else {
      logger.info('Indexer not available, falling back to database for student:', studentAddress);
      
      // Fallback to database transactions
      const offset = (page - 1) * limit;
      
      const [dbTransfers, dbTotal] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            OR: [
              { fromAddress: studentAddress },
              { toAddress: studentAddress },
              { studentAddress: studentAddress }
            ]
          },
          include: {
            receiver: {
              select: {
                address: true,
                name: true,
                type: true,
                verified: true,
                cpfCnpj: true
              }
            },
            expenseType: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.transaction.count({
          where: {
            OR: [
              { fromAddress: studentAddress },
              { toAddress: studentAddress },
              { studentAddress: studentAddress }
            ]
          }
        })
      ]);

      transfers = dbTransfers.map(transfer => ({
        txHash: transfer.txHash,
        from: transfer.fromAddress,
        to: transfer.toAddress,
        amount: transfer.amount.toString(),
        timestamp: transfer.timestamp,
        blockNumber: transfer.blockNumber.toString(),
        receiver: transfer.receiver ? {
          address: transfer.receiver.address,
          name: transfer.receiver.name,
          type: transfer.receiver.type,
          verified: transfer.receiver.verified,
          cpfCnpj: transfer.receiver.cpfCnpj
        } : {
          address: transfer.toAddress,
          name: null,
          type: 'unknown',
          verified: false,
          cpfCnpj: null
        },
        expenseType: transfer.expenseType ? {
          id: transfer.expenseType.id.toString(),
          name: transfer.expenseType.name,
          category: transfer.expenseType.category
        } : null,
        direction: transfer.fromAddress.toLowerCase() === studentAddress.toLowerCase() ? 'outgoing' : 'incoming'
      }));

      total = dbTotal;
    }

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        transfers,
        pagination: {
          page,
          limit,
          total,
          pages
        },
        source: indexerAvailable ? 'indexer' : 'database'
      }
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/student/receivers - Register a new receiver
router.post('/receivers', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.student) {
      throw new AppError('Student authentication required', 401);
    }

    const { address, name, cpfCnpj, type, description } = req.body;

    // Validate required fields
    if (!address || !name || !type) {
      throw new AppError('Address, name, and type are required', 400);
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new AppError('Invalid wallet address format', 400);
    }

    // Validate type
    const validTypes = ['establishment', 'individual', 'other'];
    if (!validTypes.includes(type)) {
      throw new AppError('Invalid receiver type. Must be: establishment, individual, or other', 400);
    }

    // Check if receiver already exists
    const existingReceiver = await prisma.receiver.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (existingReceiver) {
      throw new AppError('Receiver with this address already exists', 409);
    }

    // Create the receiver
    const receiver = await prisma.receiver.create({
      data: {
        address: address.toLowerCase(),
        name,
        cpfCnpj,
        type,
        verified: false // Students can register receivers but they need admin verification
      },
      select: {
        address: true,
        name: true,
        cpfCnpj: true,
        type: true,
        verified: true,
        createdAt: true
      }
    });

    logger.info(`Receiver ${name} (${address}) registered by student ${req.student.name}`);

    res.status(201).json({
      success: true,
      data: receiver,
      message: 'Receiver registered successfully. It will be verified by administrators.'
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/student/receivers - Get receivers registered by all users (for autocomplete)
router.get('/receivers', async (req: AuthenticatedRequest, res, next) => {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } },
        { cpfCnpj: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [receivers, total] = await Promise.all([
      prisma.receiver.findMany({
        where: whereClause,
        select: {
          address: true,
          name: true,
          cpfCnpj: true,
          type: true,
          verified: true,
          createdAt: true
        },
        orderBy: [
          { verified: 'desc' }, // Verified receivers first
          { name: 'asc' }
        ],
        skip: offset,
        take: limit,
      }),
      prisma.receiver.count({
        where: whereClause
      })
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        receivers,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/student/profile - Get student profile information
router.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.student) {
      throw new AppError('Student authentication required', 401);
    }

    const student = await prisma.student.findUnique({
      where: { walletAddress: req.student.walletAddress },
      select: {
        walletAddress: true,
        name: true,
        cpf: true,
        university: true,
        monthlyAmount: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        spendingLimits: {
          include: {
            expenseType: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Format spending limits
    const formattedSpendingLimits = student.spendingLimits.map(limit => ({
      id: limit.id.toString(),
      limitValue: limit.limitValue.toString(),
      limitType: limit.limitType,
      expenseType: {
        id: limit.expenseType.id.toString(),
        name: limit.expenseType.name,
        category: limit.expenseType.category,
        description: limit.expenseType.description
      },
      createdAt: limit.createdAt,
      updatedAt: limit.updatedAt
    }));

    res.json({
      success: true,
      data: {
        ...student,
        monthlyAmount: student.monthlyAmount.toString(),
        spendingLimits: formattedSpendingLimits
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router; 