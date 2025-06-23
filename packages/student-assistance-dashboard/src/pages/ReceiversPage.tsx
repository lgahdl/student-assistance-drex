import React from 'react';
import { Building2 } from 'lucide-react';

const ReceiversPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Receivers</h1>
          <p className="text-secondary-600">Manage known transaction receivers and their expense types</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Building2 className="h-4 w-4 mr-2" />
          Add Receiver
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">Receivers Management</h3>
            <p className="mt-1 text-sm text-secondary-500">
              This page will show all receivers with their addresses, verification status, and linked expense types.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiversPage; 