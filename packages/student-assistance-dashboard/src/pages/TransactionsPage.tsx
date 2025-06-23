import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

const TransactionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Transactions</h1>
          <p className="text-secondary-600">Monitor and categorize blockchain transactions</p>
        </div>
        <button className="btn btn-primary btn-md">
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Import Transactions
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <ArrowLeftRight className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">Transactions Monitoring</h3>
            <p className="mt-1 text-sm text-secondary-500">
              This page will show all transactions with their status, amounts, and categorization details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage; 