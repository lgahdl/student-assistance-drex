import React from 'react';
import { Tag } from 'lucide-react';

const ExpenseTypesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Expense Types</h1>
          <p className="text-secondary-600">Manage expense categories and spending limits</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Tag className="h-4 w-4 mr-2" />
          Add Expense Type
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">Expense Types Management</h3>
            <p className="mt-1 text-sm text-secondary-500">
              This page will show all expense types with their categories and usage in spending limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTypesPage; 