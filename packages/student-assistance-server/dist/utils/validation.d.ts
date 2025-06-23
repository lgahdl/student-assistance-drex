import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["admin", "staff"]>;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    role: "admin" | "staff";
}, {
    username: string;
    password: string;
    role: "admin" | "staff";
}>;
export declare const createStudentSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    name: z.ZodString;
    cpf: z.ZodString;
    university: z.ZodString;
    course: z.ZodOptional<z.ZodString>;
    monthlyAmount: z.ZodNumber;
    spendingLimits: z.ZodOptional<z.ZodArray<z.ZodObject<{
        expenseTypeId: z.ZodNumber;
        limitValue: z.ZodNumber;
        limitType: z.ZodEnum<["percentage", "absolute"]>;
    }, "strip", z.ZodTypeAny, {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }, {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    name: string;
    cpf: string;
    university: string;
    monthlyAmount: number;
    course?: string | undefined;
    spendingLimits?: {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }[] | undefined;
}, {
    walletAddress: string;
    name: string;
    cpf: string;
    university: string;
    monthlyAmount: number;
    course?: string | undefined;
    spendingLimits?: {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }[] | undefined;
}>;
export declare const updateStudentSchema: z.ZodObject<{
    walletAddress: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    cpf: z.ZodOptional<z.ZodString>;
    university: z.ZodOptional<z.ZodString>;
    course: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    monthlyAmount: z.ZodOptional<z.ZodNumber>;
    spendingLimits: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        expenseTypeId: z.ZodNumber;
        limitValue: z.ZodNumber;
        limitType: z.ZodEnum<["percentage", "absolute"]>;
    }, "strip", z.ZodTypeAny, {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }, {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    walletAddress?: string | undefined;
    name?: string | undefined;
    cpf?: string | undefined;
    university?: string | undefined;
    course?: string | undefined;
    monthlyAmount?: number | undefined;
    spendingLimits?: {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }[] | undefined;
}, {
    walletAddress?: string | undefined;
    name?: string | undefined;
    cpf?: string | undefined;
    university?: string | undefined;
    course?: string | undefined;
    monthlyAmount?: number | undefined;
    spendingLimits?: {
        expenseTypeId: number;
        limitValue: number;
        limitType: "percentage" | "absolute";
    }[] | undefined;
}>;
export declare const createReceiverSchema: z.ZodObject<{
    address: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    cpfCnpj: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["student", "establishment", "other"]>;
    verified: z.ZodDefault<z.ZodBoolean>;
    registeredBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "other" | "student" | "establishment";
    address: string;
    verified: boolean;
    name?: string | undefined;
    cpfCnpj?: string | undefined;
    registeredBy?: string | undefined;
}, {
    type: "other" | "student" | "establishment";
    address: string;
    name?: string | undefined;
    cpfCnpj?: string | undefined;
    verified?: boolean | undefined;
    registeredBy?: string | undefined;
}>;
export declare const updateReceiverSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cpfCnpj: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<["student", "establishment", "other"]>>;
    verified: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    registeredBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: "other" | "student" | "establishment" | undefined;
    name?: string | undefined;
    address?: string | undefined;
    cpfCnpj?: string | undefined;
    verified?: boolean | undefined;
    registeredBy?: string | undefined;
}, {
    type?: "other" | "student" | "establishment" | undefined;
    name?: string | undefined;
    address?: string | undefined;
    cpfCnpj?: string | undefined;
    verified?: boolean | undefined;
    registeredBy?: string | undefined;
}>;
export declare const createExpenseTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    description?: string | undefined;
}, {
    name: string;
    category: string;
    description?: string | undefined;
}>;
export declare const updateExpenseTypeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
}>;
export declare const updateTransactionSchema: z.ZodObject<{
    studentAddress: z.ZodOptional<z.ZodString>;
    receiverAddress: z.ZodOptional<z.ZodString>;
    expenseTypeId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    expenseTypeId?: number | undefined;
    studentAddress?: string | undefined;
    receiverAddress?: string | undefined;
}, {
    expenseTypeId?: number | undefined;
    studentAddress?: string | undefined;
    receiverAddress?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const studentQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    search: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    search?: string | undefined;
    active?: boolean | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    active?: "true" | "false" | undefined;
}>;
export declare const transactionQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    fromAddress: z.ZodOptional<z.ZodString>;
    toAddress: z.ZodOptional<z.ZodString>;
    isUnknownDestiny: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    fromAddress?: string | undefined;
    toAddress?: string | undefined;
    isUnknownDestiny?: boolean | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    fromAddress?: string | undefined;
    toAddress?: string | undefined;
    isUnknownDestiny?: "true" | "false" | undefined;
}>;
export declare const validateBody: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
export declare const validateQuery: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=validation.d.ts.map