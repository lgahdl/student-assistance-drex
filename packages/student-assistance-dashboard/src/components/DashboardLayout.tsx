import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowLeftRight,
  Tag,
  Menu,
  X,
  LogOut,
  User,
  Wallet,
  CreditCard,
  Shield,
  Send,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, student, logout, isStudentAuth } = useAuth();
  const location = useLocation();

  const adminNavigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Students',
      href: '/dashboard/students',
      icon: Users,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Receivers',
      href: '/dashboard/receivers',
      icon: Building2,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Transactions',
      href: '/dashboard/transactions',
      icon: ArrowLeftRight,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Expense Types',
      href: '/dashboard/expense-types',
      icon: Tag,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Vault Management',
      href: '/dashboard/vault',
      icon: Shield,
      roles: ['admin'],
    },
  ];

  const studentNavigation: NavigationItem[] = [
    {
      name: 'My Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Transfer DREX',
      href: '/dashboard/transfer',
      icon: Send,
    },
    {
      name: 'My Transactions',
      href: '/dashboard/my-transactions',
      icon: ArrowLeftRight,
    },
    {
      name: 'My Receivers',
      href: '/dashboard/my-receivers',
      icon: Building2,
    },
    {
      name: 'Payment Methods',
      href: '/dashboard/payment-methods',
      icon: CreditCard,
    },
  ];

  const navigation = isStudentAuth ? studentNavigation : adminNavigation;

  const filteredNavigation = isStudentAuth 
    ? navigation 
    : navigation.filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };


  const displayName = isStudentAuth ? student?.name : user?.username;
  const userRole = isStudentAuth ? 'Student' : user?.role;

  return (
    <div className="h-screen bg-secondary-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-secondary-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-secondary-900">Student Assistance</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-secondary-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = isCurrentPath(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-secondary-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isStudentAuth ? "bg-primary-100" : "bg-secondary-300"
              )}>
                {isStudentAuth ? (
                  <Wallet className="h-4 w-4 text-primary-600" />
                ) : (
                  <User className="h-4 w-4 text-secondary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-secondary-500 capitalize">{userRole}</p>
                {isStudentAuth && student?.walletAddress && (
                  <p className="text-xs text-secondary-400 font-mono">
                    {student.walletAddress.slice(0, 6)}...{student.walletAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-secondary-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-secondary-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex-1 lg:hidden" />
            
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-secondary-900">
                {filteredNavigation.find((item) => isCurrentPath(item.href))?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-secondary-500">
                Welcome back, {displayName}
              </div>
              {isStudentAuth && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-primary-50 rounded-full">
                  <Wallet className="h-3 w-3 text-primary-600" />
                  <span className="text-xs text-primary-600 font-medium">Student</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 