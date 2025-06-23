import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { ArrowLeftRight, Calendar, Building2, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Transfer {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
  receiver?: {
    address: string;
    name: string | null;
    type: string;
    verified: boolean;
  } | null;
}

interface TransferHistory {
  items: Transfer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const StudentTransactionsPage: React.FC = () => {
  const { student } = useAuth();
  const [transfers, setTransfers] = useState<TransferHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransfers = async (page: number = 1) => {
    if (!student) return;
    
    try {
      setLoading(true);
      const response = await apiService.getStudentTransfers({ 
        page, 
        limit: 10 
      });
      
      if (response.success) {
        setTransfers(response.data);
      } else {
        toast.error('Failed to load transfer history');
      }
    } catch (error: any) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to load transfer history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers(currentPage);
  }, [currentPage, student]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getReceiverDisplay = (transfer: Transfer) => {
    if (transfer.receiver?.name) {
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-secondary-500" />
          <span className="font-medium">{transfer.receiver.name}</span>
          {transfer.receiver.verified && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className="font-mono text-sm text-secondary-600">
          {formatAddress(transfer.toAddress)}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Unknown
        </span>
      </div>
    );
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Transactions</h1>
          <p className="text-secondary-600">View your payment history and transfer details</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search by transaction hash or receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">Transfer History</h2>
          </div>
          {transfers && (
            <p className="text-sm text-secondary-600">
              {transfers.pagination.total} total transactions
            </p>
          )}
        </div>
        <div className="card-content">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !transfers || transfers.items.length === 0 ? (
            <div className="text-center py-8">
              <ArrowLeftRight className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No transactions found</p>
              <p className="text-sm text-secondary-500">Your transfer history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.items.map((transfer) => (
                <div
                  key={transfer.txHash}
                  className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <ArrowLeftRight className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">
                            Payment to {getReceiverDisplay(transfer)}
                          </p>
                          <p className="text-sm text-secondary-600 font-mono">
                            {formatAddress(transfer.txHash)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-secondary-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(transfer.timestamp)}</span>
                        </div>
                        <div>
                          Block #{transfer.blockNumber}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-0 sm:text-right">
                      <p className="text-lg font-semibold text-red-600">
                        -{formatCurrency(transfer.amount)}
                      </p>
                      <p className="text-sm text-secondary-500">Debit</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {transfers && transfers.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary-600">
            Showing {((transfers.pagination.page - 1) * transfers.pagination.limit) + 1} to{' '}
            {Math.min(transfers.pagination.page * transfers.pagination.limit, transfers.pagination.total)} of{' '}
            {transfers.pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(transfers.pagination.page - 1)}
              disabled={transfers.pagination.page === 1}
              className="btn-secondary btn-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, transfers.pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      page === transfers.pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(transfers.pagination.page + 1)}
              disabled={transfers.pagination.page === transfers.pagination.pages}
              className="btn-secondary btn-sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTransactionsPage; 