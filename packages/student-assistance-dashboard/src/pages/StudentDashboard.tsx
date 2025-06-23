import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Wallet, DollarSign, ArrowLeftRight, Building2 } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { student } = useAuth();

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome, {student.name}!</h1>
            <p className="text-primary-100">Student Dashboard</p>
            <p className="text-sm text-primary-200 font-mono mt-1">
              {student.walletAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Monthly Allowance</p>
                <p className="text-2xl font-bold text-secondary-900">
                  R$ {parseFloat(student.monthlyAmount).toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">University</p>
                <p className="text-lg font-semibold text-secondary-900 truncate">
                  {student.university}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Course</p>
                <p className="text-lg font-semibold text-secondary-900 truncate">
                  {student.course}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Account Status</p>
                <p className={`text-lg font-semibold ${student.active ? 'text-green-600' : 'text-red-600'}`}>
                  {student.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                student.active ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Wallet className={`h-6 w-6 ${student.active ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Quick Actions</h2>
          <p className="text-sm text-secondary-600">Manage your account and transactions</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors">
              <ArrowLeftRight className="h-5 w-5 text-primary-600" />
              <div className="text-left">
                <p className="font-medium text-secondary-900">View Transactions</p>
                <p className="text-sm text-secondary-600">See your payment history</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors">
              <Building2 className="h-5 w-5 text-primary-600" />
              <div className="text-left">
                <p className="font-medium text-secondary-900">Manage Receivers</p>
                <p className="text-sm text-secondary-600">Add or edit payment destinations</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors">
              <Wallet className="h-5 w-5 text-primary-600" />
              <div className="text-left">
                <p className="font-medium text-secondary-900">Wallet Settings</p>
                <p className="text-sm text-secondary-600">Manage your wallet connection</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Activity</h2>
          <p className="text-sm text-secondary-600">Your latest transactions</p>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <ArrowLeftRight className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No recent transactions</p>
            <p className="text-sm text-secondary-500">Your transaction history will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 