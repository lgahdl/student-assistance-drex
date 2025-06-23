// Auth types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface StudentAuthResponse {
  success: boolean;
  data: {
    token: string;
    student: Student;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface WalletLoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

// Student types
export interface Student {
  walletAddress: string;
  name: string;
  cpf: string;
  university: string;
  course: string;
  monthlyAmount: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  spendingLimits?: SpendingLimit[];
}

export interface CreateStudentRequest {
  walletAddress: string;
  name: string;
  cpf: string;
  university: string;
  monthlyAmount: number;
  spendingLimits?: {
    expenseTypeId: number;
    limitValue: number;
    limitType: 'percentage' | 'absolute';
  }[];
}

// Expense Type types
export interface ExpenseType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  active: boolean;
  createdAt: string;
}

// Spending Limit types
export interface SpendingLimit {
  id: string;
  studentAddress: string;
  expenseTypeId: string;
  limitValue: string;
  limitType: 'percentage' | 'absolute';
  createdAt: string;
  updatedAt: string;
  expenseType: ExpenseType;
}

// Receiver types
export interface Receiver {
  address: string;
  name: string | null;
  cpfCnpj: string | null;
  type: string;
  verified: boolean;
  createdAt: string;
  expenseTypes?: ExpenseType[];
}

export interface CreateReceiverRequest {
  address: string;
  name?: string;
  cpfCnpj?: string;
  type: string;
  verified?: boolean;
}

// Transaction types
export interface Transaction {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
  studentAddress: string | null;
  receiverAddress: string | null;
  expenseTypeId: string | null;
  isUnknownDestiny: boolean;
  indexedAt: string;
  updatedAt: string;
  student?: Student;
  receiver?: Receiver;
  expenseType?: ExpenseType;
}

export interface UpdateTransactionRequest {
  studentAddress?: string;
  receiverAddress?: string;
  expenseTypeId?: number;
}

export interface BulkCreateTransactionsRequest {
  transactions: {
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    timestamp: string;
    blockNumber: string;
    isUnknownDestiny?: boolean;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Query parameters
export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  studentAddress?: string;
  receiverAddress?: string;
  expenseTypeId?: string;
  isUnknownDestiny?: boolean;
  startDate?: string;
  endDate?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalReceivers: number;
  verifiedReceivers: number;
  totalTransactions: number;
  totalAmount: string;
  unknownTransactions: number;
  expenseTypes: number;
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface TableSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  field: string;
  value: any;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('admin' | 'staff')[];
} 