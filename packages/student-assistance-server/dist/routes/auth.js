"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../database/client");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', (0, validation_1.validateBody)(validation_1.loginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        // Find user
        const user = await client_1.prisma.user.findUnique({
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
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id.toString(), username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        // Update last login
        await client_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        logger_1.logger.info(`User ${username} logged in successfully`);
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/auth/student/wallet - Student authentication with wallet address
router.post('/student/wallet', async (req, res, next) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            throw new errorHandler_1.AppError('Wallet address is required', 400);
        }
        // Validate wallet address format (basic check)
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new errorHandler_1.AppError('Invalid wallet address format', 400);
        }
        // Find student by wallet address
        const student = await client_1.prisma.student.findFirst({
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
            throw new errorHandler_1.AppError('Student not found or inactive', 404);
        }
        // Generate JWT token for student
        const token = jsonwebtoken_1.default.sign({
            walletAddress: student.walletAddress,
            name: student.name,
            role: 'student'
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        logger_1.logger.info(`Student ${student.name} (${walletAddress}) authenticated successfully`);
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/auth/me - Get current user info
router.get('/me', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (req.student) {
            // Student user
            const student = await client_1.prisma.student.findUnique({
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
                throw new errorHandler_1.AppError('Student not found', 404);
            }
            res.json({
                success: true,
                data: {
                    ...student,
                    monthlyAmount: student.monthlyAmount.toString(),
                    role: 'student',
                },
            });
        }
        else if (req.user) {
            // Admin/Staff user
            const user = await client_1.prisma.user.findUnique({
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
                throw new errorHandler_1.AppError('User not found', 404);
            }
            res.json({
                success: true,
                data: {
                    ...user,
                    id: user.id.toString(),
                },
            });
        }
        else {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
    }
    catch (error) {
        next(error);
    }
});
// POST /api/auth/users - Create new user (admin only)
router.post('/users', auth_1.authenticateToken, auth_1.requireAdmin, (0, validation_1.validateBody)(validation_1.createUserSchema), async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await client_1.prisma.user.create({
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
        logger_1.logger.info(`User ${username} created by ${req.user.username}`);
        res.status(201).json({
            success: true,
            data: {
                ...user,
                id: user.id.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/auth/users - List all users (admin only)
router.get('/users', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const users = await client_1.prisma.user.findMany({
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
            data: users.map((user) => ({
                ...user,
                id: user.id.toString(),
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/auth/users/:id/toggle - Toggle user active status (admin only)
router.put('/users/:id/toggle', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const userId = BigInt(req.params.id);
        const user = await client_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, active: true },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const updatedUser = await client_1.prisma.user.update({
            where: { id: userId },
            data: { active: !user.active },
            select: {
                id: true,
                username: true,
                role: true,
                active: true,
            },
        });
        logger_1.logger.info(`User ${user.username} ${updatedUser.active ? 'activated' : 'deactivated'} by ${req.user.username}`);
        res.json({
            success: true,
            data: {
                ...updatedUser,
                id: updatedUser.id.toString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/auth/logout
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // Here we just log the action
    logger_1.logger.info(`User ${req.user.username} logged out`);
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map