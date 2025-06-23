"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../database/client");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/students - List students with pagination and filters
router.get('/', (0, validation_1.validateQuery)(validation_1.studentQuerySchema), async (req, res, next) => {
    try {
        const { page, limit, search, active } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
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
            client_1.prisma.student.findMany({
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
            client_1.prisma.student.count({ where }),
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/students/:walletAddress - Get student by wallet address
router.get('/:walletAddress', async (req, res, next) => {
    try {
        const walletAddress = req.params.walletAddress;
        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new errorHandler_1.AppError('Invalid wallet address format', 400);
        }
        const student = await client_1.prisma.student.findUnique({
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
            throw new errorHandler_1.AppError('Student not found', 404);
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/students - Create new student
router.post('/', auth_1.requireStaff, (0, validation_1.validateBody)(validation_1.createStudentSchema), async (req, res, next) => {
    try {
        const { walletAddress, name, cpf, university, course, monthlyAmount, spendingLimits = [] } = req.body;
        // Check if student already exists
        const existingStudent = await client_1.prisma.student.findUnique({
            where: { walletAddress },
        });
        if (existingStudent) {
            throw new errorHandler_1.AppError('Student with this wallet address already exists', 409);
        }
        // Check if CPF already exists
        const existingCpf = await client_1.prisma.student.findUnique({
            where: { cpf },
        });
        if (existingCpf) {
            throw new errorHandler_1.AppError('Student with this CPF already exists', 409);
        }
        // Validate expense type IDs if spending limits provided
        if (spendingLimits.length > 0) {
            const expenseTypeIds = spendingLimits.map((limit) => limit.expenseTypeId);
            const existingExpenseTypes = await client_1.prisma.expenseType.findMany({
                where: { id: { in: expenseTypeIds.map((id) => BigInt(id)) } },
            });
            if (existingExpenseTypes.length !== expenseTypeIds.length) {
                throw new errorHandler_1.AppError('One or more expense types not found', 400);
            }
        }
        // Create student with spending limits in a transaction
        const result = await client_1.prisma.$transaction(async (tx) => {
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
                    data: spendingLimits.map((limit) => ({
                        studentAddress: student.walletAddress,
                        expenseTypeId: BigInt(limit.expenseTypeId),
                        limitValue: limit.limitValue,
                        limitType: limit.limitType,
                    })),
                });
            }
            return student;
        });
        logger_1.logger.info(`Student ${name} created by ${req.user.username}`);
        res.status(201).json({
            success: true,
            data: {
                ...result,
                monthlyAmount: result.monthlyAmount.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/students/:walletAddress - Update student
router.put('/:walletAddress', auth_1.requireStaff, (0, validation_1.validateBody)(validation_1.updateStudentSchema), async (req, res, next) => {
    try {
        const walletAddress = req.params.walletAddress;
        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new errorHandler_1.AppError('Invalid wallet address format', 400);
        }
        const student = await client_1.prisma.student.update({
            where: { walletAddress },
            data: req.body,
        });
        logger_1.logger.info(`Student ${student.name} updated by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...student,
                monthlyAmount: student.monthlyAmount.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/students/:walletAddress - Delete student
router.delete('/:walletAddress', auth_1.requireStaff, async (req, res, next) => {
    try {
        const walletAddress = req.params.walletAddress;
        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new errorHandler_1.AppError('Invalid wallet address format', 400);
        }
        const student = await client_1.prisma.student.delete({
            where: { walletAddress },
        });
        logger_1.logger.info(`Student ${student.name} deleted by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...student,
                monthlyAmount: student.monthlyAmount.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/students/:walletAddress/toggle-active - Toggle student active status
router.put('/:walletAddress/toggle-active', auth_1.requireStaff, async (req, res, next) => {
    try {
        const walletAddress = req.params.walletAddress;
        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new errorHandler_1.AppError('Invalid wallet address format', 400);
        }
        const currentStudent = await client_1.prisma.student.findUnique({
            where: { walletAddress },
            select: { walletAddress: true, name: true, active: true },
        });
        if (!currentStudent) {
            throw new errorHandler_1.AppError('Student not found', 404);
        }
        const student = await client_1.prisma.student.update({
            where: { walletAddress },
            data: { active: !currentStudent.active },
        });
        logger_1.logger.info(`Student ${student.name} ${student.active ? 'activated' : 'deactivated'} by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...student,
                monthlyAmount: student.monthlyAmount.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=students.js.map