import React, { useState, useEffect } from 'react';
import { Users, Building2, ArrowLeftRight, Tag, Clock, AlertCircle } from 'lucide-react';
import { Transaction, DashboardStats } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await apiService.getTransactionStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch recent transactions
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        const response = await apiService.getTransactions({ 
          page: 1, 
          limit: 5,
          // Sort by most recent
        });
        if (response.success) {
          setRecentTransactions(response.data.items || []);
        }
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
        setError('Failed to load recent transactions');
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  const defaultStats = [
    {
      name: 'Total Students',
      value: stats?.totalStudents?.toString() || '0',
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Active Receivers',
      value: stats?.verifiedReceivers?.toString() || '0',
      icon: Building2,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: 'Total Transactions',
      value: stats?.totalTransactions?.toString() || '0',
      icon: ArrowLeftRight,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      name: 'Expense Types',
      value: stats?.expenseTypes?.toString() || '0',
      icon: Tag,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
  ];

  const formatTransactionTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      }
    } catch {
      return 'Unknown time';
    }
  };

  const formatAmount = (amount: string) => {
    try {
      return `R$ ${parseFloat(amount).toFixed(2)}`;
    } catch {
      return amount;
    }
  };

  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.isUnknownDestiny) {
      return { color: 'bg-warning-500', label: 'Unknown destination' };
    } else if (transaction.receiver) {
      return { color: 'bg-success-500', label: 'Verified receiver' };
    } else {
      return { color: 'bg-blue-500', label: 'Transaction' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard Overview</h1>
        <p className="text-secondary-600">
          Welcome to the Student Assistance System. Here's what's happening today.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {defaultStats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-md flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-secondary-500 truncate">{stat.name}</dt>
                    <dd className="flex items-center">
                      {isLoadingStats ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <span className="text-lg font-medium text-secondary-900">{stat.value}</span>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-secondary-900">Quick Actions</h2>
          <p className="text-sm text-secondary-600">
            Common tasks to manage the student assistance system
          </p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn btn-primary btn-md">
              <Users className="h-4 w-4 mr-2" />
              Add Student
            </button>
            <button className="btn btn-secondary btn-md">
              <Building2 className="h-4 w-4 mr-2" />
              Add Receiver
            </button>
            <button className="btn btn-secondary btn-md">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              View Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity - Real Transaction Data */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-secondary-900">Recent Activity</h2>
          <p className="text-sm text-secondary-600">
            Latest transactions from the blockchain indexer
          </p>
        </div>
        <div className="card-content">
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-secondary-600">Loading recent transactions...</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No recent transactions</p>
              <p className="text-sm text-secondary-500">Transaction activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const status = getTransactionStatus(transaction);
                return (
                  <div key={transaction.txHash} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`h-2 w-2 ${status.color} rounded-full flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-secondary-900 font-medium">
                            Transaction {formatAmount(transaction.amount)}
                          </span>
                          {transaction.student && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {transaction.student.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-secondary-500 font-mono">
                            From: {transaction.fromAddress.slice(0, 6)}...{transaction.fromAddress.slice(-4)}
                          </span>
                          <ArrowLeftRight className="h-3 w-3 text-secondary-400" />
                          <span className="text-xs text-secondary-500 font-mono">
                            To: {transaction.toAddress.slice(0, 6)}...{transaction.toAddress.slice(-4)}
                          </span>
                        </div>
                        {transaction.receiver && (
                          <span className="text-xs text-green-600 mt-1 block">
                            → {transaction.receiver.name || 'Verified Receiver'}
                          </span>
                        )}
                        {transaction.expenseType && (
                          <span className="text-xs text-purple-600 mt-1 block">
                            Category: {transaction.expenseType.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-xs text-secondary-500">
                        {formatTransactionTime(transaction.timestamp)}
                      </span>
                      <div className="text-xs text-secondary-400 mt-1">
                        Block #{transaction.blockNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 