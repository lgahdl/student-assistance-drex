import { z } from 'zod';

// User schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff'], { required_error: 'Role must be admin or staff' }),
});

// Student schemas
export const createStudentSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  name: z.string().min(1, 'Name is required'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF must be 11 digits'),
  university: z.string().min(1, 'University is required'),
  course: z.string().optional(),
  monthlyAmount: z.number().positive('Monthly amount must be positive'),
  spendingLimits: z.array(z.object({
    expenseTypeId: z.number().int().positive(),
    limitValue: z.number().nonnegative(),
    limitType: z.enum(['percentage', 'absolute']),
  })).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// Receiver schemas
export const createReceiverSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address'),
  name: z.string().optional(),
  cpfCnpj: z.string().optional(),
  type: z.enum(['student', 'establishment', 'other']),
  verified: z.boolean().default(false),
  registeredBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid registeredBy wallet address').optional(),
});

export const updateReceiverSchema = createReceiverSchema.partial();

// Expense Type schemas
export const createExpenseTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
});

export const updateExpenseTypeSchema = createExpenseTypeSchema.partial();

// Transaction schemas
export const updateTransactionSchema = z.object({
  studentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid student wallet address').optional(),
  receiverAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid receiver address').optional(),
  expenseTypeId: z.number().int().positive().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const studentQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  active: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export const transactionQuerySchema = paginationSchema.extend({
  fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  isUnknownDestiny: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

// Validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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