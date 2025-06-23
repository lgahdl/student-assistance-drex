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
// GET /api/expense-types - List all expense types
router.get('/', async (req, res, next) => {
    try {
        const { active } = req.query;
        const where = {};
        if (active === 'true') {
            where.active = true;
        }
        else if (active === 'false') {
            where.active = false;
        }
        const expenseTypes = await client_1.prisma.expenseType.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/expense-types/:id - Get expense type by ID
router.get('/:id', async (req, res, next) => {
    try {
        const expenseTypeId = BigInt(req.params.id);
        const expenseType = await client_1.prisma.expenseType.findUnique({
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
            throw new errorHandler_1.AppError('Expense type not found', 404);
        }
        res.json({
            success: true,
            data: {
                ...expenseType,
                id: expenseType.id.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/expense-types - Create new expense type
router.post('/', auth_1.requireStaff, (0, validation_1.validateBody)(validation_1.createExpenseTypeSchema), async (req, res, next) => {
    try {
        const { name, description, category } = req.body;
        const expenseType = await client_1.prisma.expenseType.create({
            data: {
                name,
                description,
                category,
            },
        });
        logger_1.logger.info(`Expense type '${name}' created by ${req.user.username}`);
        res.status(201).json({
            success: true,
            data: {
                ...expenseType,
                id: expenseType.id.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/expense-types/:id - Update expense type
router.put('/:id', auth_1.requireStaff, (0, validation_1.validateBody)(validation_1.updateExpenseTypeSchema), async (req, res, next) => {
    try {
        const expenseTypeId = BigInt(req.params.id);
        const expenseType = await client_1.prisma.expenseType.update({
            where: { id: expenseTypeId },
            data: req.body,
        });
        logger_1.logger.info(`Expense type '${expenseType.name}' updated by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...expenseType,
                id: expenseType.id.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/expense-types/:id - Soft delete expense type (set active = false)
router.delete('/:id', auth_1.requireStaff, async (req, res, next) => {
    try {
        const expenseTypeId = BigInt(req.params.id);
        // Check if expense type is being used
        const usage = await client_1.prisma.expenseType.findUnique({
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
            throw new errorHandler_1.AppError('Expense type not found', 404);
        }
        if (usage._count.spendingLimits > 0 || usage._count.transactions > 0) {
            // Soft delete if being used
            const expenseType = await client_1.prisma.expenseType.update({
                where: { id: expenseTypeId },
                data: { active: false },
            });
            logger_1.logger.info(`Expense type '${expenseType.name}' deactivated by ${req.user.username}`);
            res.json({
                success: true,
                message: 'Expense type deactivated (cannot be deleted as it has associated records)',
                data: {
                    ...expenseType,
                    id: expenseType.id.toString(),
                },
            });
        }
        else {
            // Hard delete if not being used
            const expenseType = await client_1.prisma.expenseType.delete({
                where: { id: expenseTypeId },
            });
            logger_1.logger.info(`Expense type '${expenseType.name}' deleted by ${req.user.username}`);
            res.json({
                success: true,
                message: 'Expense type deleted successfully',
                data: {
                    ...expenseType,
                    id: expenseType.id.toString(),
                },
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/expense-types/:id/activate - Reactivate expense type
router.put('/:id/activate', auth_1.requireStaff, async (req, res, next) => {
    try {
        const expenseTypeId = BigInt(req.params.id);
        const expenseType = await client_1.prisma.expenseType.update({
            where: { id: expenseTypeId },
            data: { active: true },
        });
        logger_1.logger.info(`Expense type '${expenseType.name}' activated by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...expenseType,
                id: expenseType.id.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/expense-types/categories - Get all categories
router.get('/meta/categories', async (req, res, next) => {
    try {
        const categories = await client_1.prisma.expenseType.findMany({
            where: { active: true },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });
        res.json({
            success: true,
            data: categories.map(item => item.category),
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=expense-types.js.map