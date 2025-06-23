import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Student, LoginRequest, WalletLoginRequest } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  student: Student | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStudentAuth: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  walletLogin: (credentials: WalletLoginRequest) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app start
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          // Try to get user info by making a test request
          await apiService.healthCheck();
          // If we have a token but no user data, we might need to handle this
          // For now, we'll create a placeholder user since the API doesn't have a /me endpoint
          const storedUser = localStorage.getItem('user');
          const storedStudent = localStorage.getItem('student');
          
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          if (storedStudent) {
            setStudent(JSON.parse(storedStudent));
          }
        }
      } catch (error) {
        // Token is invalid, clear it
        apiService.clearToken();
        localStorage.removeItem('user');
        localStorage.removeItem('student');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      if (response.success) {
        setUser(response.data.user);
        setStudent(null); // Clear student data when logging in as admin/staff
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('student');
        toast.success('Login successful!');
        return true;
      } else {
        toast.error('Login failed');
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const walletLogin = async (credentials: WalletLoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.walletLogin(credentials);
      
      if (response.success) {
        setStudent(response.data.student);
        setUser(null); // Clear admin/staff data when logging in as student
        localStorage.setItem('student', JSON.stringify(response.data.student));
        localStorage.removeItem('user');
        toast.success('Wallet login successful!');
        return true;
      } else {
        toast.error('Wallet login failed');
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Wallet login failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setStudent(null);
    localStorage.removeItem('user');
    localStorage.removeItem('student');
    toast.success('Logged out successfully');
  };

  const isAuthenticated = (!!user && apiService.isAuthenticated()) || !!student;
  const isStudentAuth = !!student && !user;

  const value: AuthContextType = {
    user,
    student,
    isLoading,
    isAuthenticated,
    isStudentAuth,
    login,
    walletLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 