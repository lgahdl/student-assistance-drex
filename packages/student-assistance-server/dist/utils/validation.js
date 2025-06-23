"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = exports.transactionQuerySchema = exports.studentQuerySchema = exports.paginationSchema = exports.updateTransactionSchema = exports.updateExpenseTypeSchema = exports.createExpenseTypeSchema = exports.updateReceiverSchema = exports.createReceiverSchema = exports.updateStudentSchema = exports.createStudentSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// User schemas
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['admin', 'staff'], { required_error: 'Role must be admin or staff' }),
});
// Student schemas
exports.createStudentSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    name: zod_1.z.string().min(1, 'Name is required'),
    cpf: zod_1.z.string().regex(/^\d{11}$/, 'CPF must be 11 digits'),
    university: zod_1.z.string().min(1, 'University is required'),
    course: zod_1.z.string().optional(),
    monthlyAmount: zod_1.z.number().positive('Monthly amount must be positive'),
    spendingLimits: zod_1.z.array(zod_1.z.object({
        expenseTypeId: zod_1.z.number().int().positive(),
        limitValue: zod_1.z.number().nonnegative(),
        limitType: zod_1.z.enum(['percentage', 'absolute']),
    })).optional(),
});
exports.updateStudentSchema = exports.createStudentSchema.partial();
// Receiver schemas
exports.createReceiverSchema = zod_1.z.object({
    address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address'),
    name: zod_1.z.string().optional(),
    cpfCnpj: zod_1.z.string().optional(),
    type: zod_1.z.enum(['student', 'establishment', 'other']),
    verified: zod_1.z.boolean().default(false),
    registeredBy: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid registeredBy wallet address').optional(),
});
exports.updateReceiverSchema = exports.createReceiverSchema.partial();
// Expense Type schemas
exports.createExpenseTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, 'Category is required'),
});
exports.updateExpenseTypeSchema = exports.createExpenseTypeSchema.partial();
// Transaction schemas
exports.updateTransactionSchema = zod_1.z.object({
    studentAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid student wallet address').optional(),
    receiverAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid receiver address').optional(),
    expenseTypeId: zod_1.z.number().int().positive().optional(),
});
// Query schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
});
exports.studentQuerySchema = exports.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    active: zod_1.z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});
exports.transactionQuerySchema = exports.paginationSchema.extend({
    fromAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    toAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    isUnknownDestiny: zod_1.z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});
// Validation middleware
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors,
                });
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Query validation failed',
                    details: error.errors,
                });
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validation.js.map