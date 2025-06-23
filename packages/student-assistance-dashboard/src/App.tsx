import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Admin/Staff page imports
import DashboardHome from './pages/DashboardHome';
import StudentsPage from './pages/StudentsPage';
import ReceiversPage from './pages/ReceiversPage';
import TransactionsPage from './pages/TransactionsPage';
import ExpenseTypesPage from './pages/ExpenseTypesPage';
import VaultManagementPage from './pages/VaultManagementPage';

// Student page imports
import StudentDashboard from './pages/StudentDashboard';
import StudentTransferPage from './pages/StudentTransferPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
  studentOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, studentOnly }) => {
  const { isAuthenticated, user, isStudentAuth, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If this route is student-only and user is not a student, redirect
  if (studentOnly && !isStudentAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  // If this route requires admin/staff role and user is a student, redirect
  if (requiredRole && isStudentAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check role requirements for admin/staff users
  if (requiredRole && !isStudentAuth && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, isLoading, isStudentAuth } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                {/* Dashboard home - different for students vs admin/staff */}
                <Route 
                  index 
                  element={
                    isStudentAuth ? (
                      <StudentDashboard />
                    ) : (
                      <DashboardHome />
                    )
                  } 
                />
                
                {/* Admin/Staff only routes */}
                <Route 
                  path="students" 
                  element={
                    <ProtectedRoute requiredRole="staff">
                      <StudentsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="receivers" 
                  element={
                    <ProtectedRoute requiredRole="staff">
                      <ReceiversPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="transactions" 
                  element={
                    <ProtectedRoute requiredRole="staff">
                      <TransactionsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="expense-types" 
                  element={
                    <ProtectedRoute requiredRole="staff">
                      <ExpenseTypesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="vault" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <VaultManagementPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Student only routes */}
                <Route 
                  path="transfer" 
                  element={
                    <ProtectedRoute studentOnly>
                      <StudentTransferPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="my-transactions" 
                  element={
                    <ProtectedRoute studentOnly>
                      <div className="card">
                        <div className="card-content">
                          <h2 className="text-xl font-semibold mb-4">My Transactions</h2>
                          <p className="text-secondary-600">Your transaction history will be displayed here.</p>
                        </div>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="my-receivers" 
                  element={
                    <ProtectedRoute studentOnly>
                      <div className="card">
                        <div className="card-content">
                          <h2 className="text-xl font-semibold mb-4">My Receivers</h2>
                          <p className="text-secondary-600">Manage your payment destinations here.</p>
                        </div>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="payment-methods" 
                  element={
                    <ProtectedRoute studentOnly>
                      <div className="card">
                        <div className="card-content">
                          <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
                          <p className="text-secondary-600">Manage your wallet and payment settings here.</p>
                        </div>
                      </div>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App; 