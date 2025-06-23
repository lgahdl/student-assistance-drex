"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("../database/client");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/receivers - List receivers with pagination and filters
router.get('/', (0, validation_1.validateQuery)(validation_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    type: zod_1.z.enum(['student', 'establishment', 'other']).optional(),
    verified: zod_1.z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    registeredBy: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
})), async (req, res, next) => {
    try {
        const { page, limit, search, type, verified, registeredBy } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        // If student, only show receivers they registered
        if (req.student) {
            where.registeredBy = req.student.walletAddress;
        }
        else if (registeredBy) {
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
            client_1.prisma.receiver.findMany({
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
            client_1.prisma.receiver.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                receivers: receivers.map((receiver) => ({
                    ...receiver,
                    expenseTypes: receiver.expenseTypes.map((et) => ({
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/receivers/:address - Get receiver by address
router.get('/:address', auth_1.requireStudentOrStaff, async (req, res, next) => {
    try {
        const address = req.params.address;
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new errorHandler_1.AppError('Invalid address format', 400);
        }
        const receiver = await client_1.prisma.receiver.findUnique({
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
            throw new errorHandler_1.AppError('Receiver not found', 404);
        }
        // If student, check if they registered this receiver (temporarily disabled until schema is updated)
        // if (req.student && receiver.registeredBy !== req.student.walletAddress) {
        //   throw new AppError('Access denied', 403);
        // }
        res.json({
            success: true,
            data: {
                ...receiver,
                expenseTypes: receiver.expenseTypes.map((et) => ({
                    ...et.expenseType,
                    id: et.expenseType.id.toString(),
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/receivers/check/:address - Check if receiver exists
router.get('/check/:address', async (req, res, next) => {
    try {
        const addressValue = req.params.address;
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(addressValue)) {
            throw new errorHandler_1.AppError('Invalid address format', 400);
        }
        const receiver = await client_1.prisma.receiver.findUnique({
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/receivers - Create new receiver
router.post('/', auth_1.requireStudentOrStaff, (0, validation_1.validateBody)(validation_1.createReceiverSchema), async (req, res, next) => {
    try {
        const { address, name, cpfCnpj, type, verified = false, registeredBy } = req.body;
        // Check if receiver already exists
        const existingReceiver = await client_1.prisma.receiver.findUnique({
            where: { address },
        });
        if (existingReceiver) {
            throw new errorHandler_1.AppError('Receiver with this address already exists', 409);
        }
        // Determine who registered this receiver
        let finalRegisteredBy = registeredBy;
        if (req.student) {
            // Students can only register receivers for themselves
            finalRegisteredBy = req.student.walletAddress;
        }
        else if (req.user && !registeredBy) {
            // Staff/admin can create without registeredBy (global receivers)
            finalRegisteredBy = null;
        }
        const receiver = await client_1.prisma.receiver.create({
            data: {
                address,
                name,
                cpfCnpj,
                type,
                verified: req.user ? verified : false, // Only staff/admin can set verified
                registeredBy: finalRegisteredBy,
            },
        });
        const loggedBy = req.student ? `student ${req.student.name}` : `user ${req.user.username}`;
        logger_1.logger.info(`Receiver ${address} created by ${loggedBy}`);
        res.status(201).json({
            success: true,
            data: receiver,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/receivers/:address - Update receiver
router.put('/:address', auth_1.requireStudentOrStaff, (0, validation_1.validateBody)(validation_1.updateReceiverSchema), async (req, res, next) => {
    try {
        const address = req.params.address;
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new errorHandler_1.AppError('Invalid address format', 400);
        }
        // Check if receiver exists
        const existingReceiver = await client_1.prisma.receiver.findUnique({
            where: { address },
        });
        if (!existingReceiver) {
            throw new errorHandler_1.AppError('Receiver not found', 404);
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
        const receiver = await client_1.prisma.receiver.update({
            where: { address },
            data: updateData,
        });
        const loggedBy = req.student ? `student ${req.student.name}` : `user ${req.user.username}`;
        logger_1.logger.info(`Receiver ${address} updated by ${loggedBy}`);
        res.json({
            success: true,
            data: receiver,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/receivers/:address/verify - Toggle receiver verification
router.put('/:address/verify', auth_1.requireStaff, async (req, res, next) => {
    try {
        const address = req.params.address;
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new errorHandler_1.AppError('Invalid address format', 400);
        }
        const currentReceiver = await client_1.prisma.receiver.findUnique({
            where: { address },
            select: { address: true, verified: true },
        });
        if (!currentReceiver) {
            throw new errorHandler_1.AppError('Receiver not found', 404);
        }
        const receiver = await client_1.prisma.receiver.update({
            where: { address },
            data: { verified: !currentReceiver.verified },
        });
        logger_1.logger.info(`Receiver ${receiver.address} ${receiver.verified ? 'verified' : 'unverified'} by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...receiver,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/receivers/:address - Delete receiver
router.delete('/:address', auth_1.requireStaff, async (req, res, next) => {
    try {
        const address = req.params.address;
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new errorHandler_1.AppError('Invalid address format', 400);
        }
        const receiver = await client_1.prisma.receiver.delete({
            where: { address },
        });
        logger_1.logger.info(`Receiver ${address} deleted by ${req.user.username}`);
        res.json({
            success: true,
            data: receiver,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=receivers.js.map