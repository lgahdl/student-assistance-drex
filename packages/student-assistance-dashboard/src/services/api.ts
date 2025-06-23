import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  WalletLoginRequest,
  StudentAuthResponse,
  ApiResponse, 
  PaginatedResponse,
  Student,
  CreateStudentRequest,
  StudentQueryParams,
  ExpenseType,
  Receiver,
  CreateReceiverRequest,
  Transaction,
  UpdateTransactionRequest,
  BulkCreateTransactionsRequest,
  TransactionQueryParams,
  DashboardStats
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Initialize token from localStorage
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/api/auth/login', credentials);
    if (response.data.success) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async walletLogin(credentials: WalletLoginRequest): Promise<StudentAuthResponse> {
    const response: AxiosResponse<StudentAuthResponse> = await this.api.post('/api/auth/student/wallet', credentials);
    if (response.data.success) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Students
  async getStudents(params?: StudentQueryParams): Promise<PaginatedResponse<Student>> {
    const response = await this.api.get('/api/students', { params });
    return response.data;
  }

  async getStudent(walletAddress: string): Promise<ApiResponse<Student>> {
    const response = await this.api.get(`/api/students/${walletAddress}`);
    return response.data;
  }

  async createStudent(data: CreateStudentRequest): Promise<ApiResponse<Student>> {
    const response = await this.api.post('/api/students', data);
    return response.data;
  }

  async updateStudent(walletAddress: string, data: Partial<CreateStudentRequest>): Promise<ApiResponse<Student>> {
    const response = await this.api.put(`/api/students/${walletAddress}`, data);
    return response.data;
  }

  async deleteStudent(walletAddress: string): Promise<ApiResponse<Student>> {
    const response = await this.api.delete(`/api/students/${walletAddress}`);
    return response.data;
  }

  async toggleStudentActive(walletAddress: string): Promise<ApiResponse<Student>> {
    const response = await this.api.put(`/api/students/${walletAddress}/toggle-active`);
    return response.data;
  }

  // Expense Types
  async getExpenseTypes(): Promise<ApiResponse<ExpenseType[]>> {
    const response = await this.api.get('/api/expense-types');
    return response.data;
  }

  async getExpenseType(id: string): Promise<ApiResponse<ExpenseType>> {
    const response = await this.api.get(`/api/expense-types/${id}`);
    return response.data;
  }

  async createExpenseType(data: Omit<ExpenseType, 'id' | 'createdAt'>): Promise<ApiResponse<ExpenseType>> {
    const response = await this.api.post('/api/expense-types', data);
    return response.data;
  }

  async updateExpenseType(id: string, data: Partial<ExpenseType>): Promise<ApiResponse<ExpenseType>> {
    const response = await this.api.put(`/api/expense-types/${id}`, data);
    return response.data;
  }

  async deleteExpenseType(id: string): Promise<ApiResponse<ExpenseType>> {
    const response = await this.api.delete(`/api/expense-types/${id}`);
    return response.data;
  }

  // Receivers
  async getReceivers(params?: { type?: string; verified?: boolean; search?: string }): Promise<ApiResponse<Receiver[]>> {
    const response = await this.api.get('/api/receivers', { params });
    return response.data;
  }

  async getReceiver(address: string): Promise<ApiResponse<Receiver>> {
    const response = await this.api.get(`/api/receivers/${address}`);
    return response.data;
  }

  async checkReceiver(address: string): Promise<ApiResponse<{ exists: boolean; receiver: Receiver | null }>> {
    const response = await this.api.get(`/api/receivers/check/${address}`);
    return response.data;
  }

  async createReceiver(data: CreateReceiverRequest): Promise<ApiResponse<Receiver>> {
    const response = await this.api.post('/api/receivers', data);
    return response.data;
  }

  async updateReceiver(address: string, data: Partial<CreateReceiverRequest>): Promise<ApiResponse<Receiver>> {
    const response = await this.api.put(`/api/receivers/${address}`, data);
    return response.data;
  }

  async toggleReceiverVerification(address: string): Promise<ApiResponse<Receiver>> {
    const response = await this.api.put(`/api/receivers/${address}/verify`);
    return response.data;
  }

  async deleteReceiver(address: string): Promise<ApiResponse<Receiver>> {
    const response = await this.api.delete(`/api/receivers/${address}`);
    return response.data;
  }

  // Transactions
  async getTransactions(params?: TransactionQueryParams): Promise<PaginatedResponse<Transaction>> {
    const response = await this.api.get('/api/transactions', { params });
    return response.data;
  }

  async getTransaction(txHash: string): Promise<ApiResponse<Transaction>> {
    const response = await this.api.get(`/api/transactions/${txHash}`);
    return response.data;
  }

  async getStudentTransactions(
    studentAddress: string, 
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Transaction>> {
    const response = await this.api.get(`/api/transactions/student/${studentAddress}`, { params });
    return response.data;
  }

  async updateTransaction(txHash: string, data: UpdateTransactionRequest): Promise<ApiResponse<Transaction>> {
    const response = await this.api.put(`/api/transactions/${txHash}`, data);
    return response.data;
  }

  async bulkCreateTransactions(data: BulkCreateTransactionsRequest): Promise<ApiResponse<{ created: number }>> {
    const response = await this.api.post('/api/transactions/bulk-create', data);
    return response.data;
  }

  async getTransactionStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.api.get('/api/transactions/stats');
    return response.data;
  }

  // Student-specific endpoints
  async getStudentTransfers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await this.api.get('/api/student/transfers', { params });
    return response.data;
  }

  async getStudentReceivers(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Receiver>> {
    const response = await this.api.get('/api/student/receivers', { params });
    return response.data;
  }

  async createStudentReceiver(data: CreateReceiverRequest): Promise<ApiResponse<Receiver>> {
    const response = await this.api.post('/api/student/receivers', data);
    return response.data;
  }

  async getStudentProfile(): Promise<ApiResponse<Student>> {
    const response = await this.api.get('/api/student/profile');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 