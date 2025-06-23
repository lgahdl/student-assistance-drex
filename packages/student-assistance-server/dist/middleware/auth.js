"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStudentOrStaff = exports.requireStudent = exports.requireStaff = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../database/client");
const logger_1 = require("../utils/logger");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if it's a student token
        if (decoded.role === 'student' && decoded.walletAddress) {
            // Verify student still exists and is active
            const student = await client_1.prisma.student.findUnique({
                where: { walletAddress: decoded.walletAddress },
                select: { walletAddress: true, name: true, active: true }
            });
            if (!student || !student.active) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            req.student = {
                walletAddress: student.walletAddress,
                name: student.name,
                role: 'student'
            };
        }
        else {
            // Verify admin/staff user still exists and is active
            const user = await client_1.prisma.user.findUnique({
                where: { id: BigInt(decoded.userId) },
                select: { id: true, username: true, role: true, active: true }
            });
            if (!user || !user.active) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            req.user = {
                id: user.id.toString(),
                username: user.username,
                role: user.role
            };
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role || req.student?.role;
        if (!userRole) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Specific role middlewares
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireStaff = (0, exports.requireRole)(['admin', 'staff']);
exports.requireStudent = (0, exports.requireRole)(['student']);
exports.requireStudentOrStaff = (0, exports.requireRole)(['student', 'admin', 'staff']);
//# sourceMappingURL=auth.js.map