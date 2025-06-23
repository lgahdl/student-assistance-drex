"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../database/client");
const router = (0, express_1.Router)();
// GET /health - Basic health check
router.get('/', async (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'student-assistance-server',
    });
});
// GET /health/detailed - Detailed health check with database status
router.get('/detailed', async (req, res) => {
    try {
        // Test database connection
        await client_1.prisma.$queryRaw `SELECT 1`;
        // Get some basic stats
        const [studentCount, userCount, transactionCount] = await Promise.all([
            client_1.prisma.student.count(),
            client_1.prisma.user.count(),
            client_1.prisma.transaction.count(),
        ]);
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'student-assistance-server',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: 'connected',
                stats: {
                    students: studentCount,
                    users: userCount,
                    transactions: transactionCount,
                },
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            service: 'student-assistance-server',
            database: {
                status: 'disconnected',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map