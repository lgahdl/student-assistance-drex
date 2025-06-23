import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, User, Lock, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWeb3 } from '../hooks/useWeb3';
import LoadingSpinner from '../components/LoadingSpinner';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, walletLogin } = useAuth();
  const { connectWallet, signMessage, isConnected, account, isLoading: web3Loading } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'student'>('admin');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const success = await login(data);
    setIsLoading(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleWalletLogin = async () => {
    try {
      setIsLoading(true);
      
      // First connect wallet if not connected
      let walletAddress = account;
      if (!isConnected) {
        walletAddress = await connectWallet();
        if (!walletAddress) {
          setIsLoading(false);
          return;
        }
      }

      // Create message to sign
      const message = `Sign this message to authenticate with Student Assistance System.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      // Sign message
      const signature = await signMessage(message);
      if (!signature) {
        setIsLoading(false);
        return;
      }

      // Authenticate with backend
      const success = await walletLogin({
        walletAddress: walletAddress!,
        signature,
        message,
      });

      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Wallet login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900">Student Assistance</h2>
          <p className="mt-2 text-secondary-600">Sign in to access the dashboard</p>
        </div>

        {/* Login Type Toggle */}
        <div className="card">
          <div className="card-content">
            <div className="flex rounded-lg bg-secondary-100 p-1">
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'admin'
                    ? 'bg-white text-secondary-900 shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                Admin / Staff
              </button>
              <button
                type="button"
                onClick={() => setLoginType('student')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'student'
                    ? 'bg-white text-secondary-900 shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                Student
              </button>
            </div>
          </div>
        </div>

        {/* Login Forms */}
        {loginType === 'admin' ? (
          /* Traditional Login Form */
          <div className="card">
            <div className="card-content space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-secondary-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-secondary-400" />
                    </div>
                    <input
                      {...register('username')}
                      type="text"
                      className="input pl-10"
                      placeholder="Enter your username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-error-600">{errors.username.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-secondary-400" />
                    </div>
                    <input
                      {...register('password')}
                      type="password"
                      className="input pl-10"
                      placeholder="Enter your password"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg w-full"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Wallet Login */
          <div className="card">
            <div className="card-content space-y-6">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Connect Your Wallet</h3>
                <p className="text-sm text-secondary-600 mb-6">
                  Students can access their dashboard by connecting their MetaMask wallet
                </p>
              </div>

              {isConnected && account ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                      <p className="text-xs text-green-600 font-mono">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleWalletLogin}
                disabled={isLoading || web3Loading}
                className="btn btn-primary btn-lg w-full"
              >
                {isLoading || web3Loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                {isLoading || web3Loading 
                  ? 'Connecting...' 
                  : isConnected 
                    ? 'Sign In with Wallet' 
                    : 'Connect MetaMask'
                }
              </button>

              {!isConnected && (
                <p className="text-xs text-secondary-500 text-center">
                  Make sure you have MetaMask installed and unlocked
                </p>
              )}
            </div>
          </div>
        )}

        {/* Demo Credentials - Only show for admin login */}
        {loginType === 'admin' && (
          <div className="card bg-secondary-50">
            <div className="card-content">
              <h3 className="text-sm font-medium text-secondary-900 mb-2">Demo Credentials</h3>
              <div className="space-y-1 text-sm text-secondary-600">
                <div>
                  <span className="font-medium">Admin:</span> username="admin", password="admin123"
                </div>
                <div>
                  <span className="font-medium">Staff:</span> username="staff", password="staff123"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-secondary-500">
          <p>Student Assistance System v1.0.0</p>
          <p>Blockchain-powered educational funding platform</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 