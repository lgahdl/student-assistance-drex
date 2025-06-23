import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftRight, DollarSign, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWeb3 } from '../hooks/useWeb3';
import { Receiver } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const transferSchema = z.object({
  receiverAddress: z.string().min(1, 'Receiver is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0.01'),
  expenseTypeId: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

const StudentTransferPage: React.FC = () => {
  const { student } = useAuth();
  const { account, isConnected } = useWeb3();
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [isLoadingReceivers, setIsLoadingReceivers] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [studentBalance, setStudentBalance] = useState<string>('0');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const selectedReceiverAddress = watch('receiverAddress');
  const selectedReceiver = receivers.find(r => r.address === selectedReceiverAddress);

  // Fetch student's receivers
  useEffect(() => {
    const fetchReceivers = async () => {
      try {
        setIsLoadingReceivers(true);
        const response = await apiService.getReceivers();
        if (response.success) {
          // Filter to show only verified receivers for students
          const verifiedReceivers = response.data.filter(r => r.verified);
          setReceivers(verifiedReceivers);
        }
      } catch (error) {
        console.error('Error fetching receivers:', error);
        toast.error('Failed to load receivers');
      } finally {
        setIsLoadingReceivers(false);
      }
    };

    fetchReceivers();
  }, []);

  // Mock function to get student balance from vault contract
  // In a real implementation, this would call the smart contract
  const fetchStudentBalance = async () => {
    try {
      // This would be replaced with actual smart contract call
      // const vaultContract = new ethers.Contract(vaultAddress, vaultABI, provider);
      // const balance = await vaultContract.getStudentBalance(student?.walletAddress);
      // setStudentBalance(ethers.formatEther(balance));
      
      // For now, use mock data
      setStudentBalance('500.00');
    } catch (error) {
      console.error('Error fetching balance:', error);
      setStudentBalance('0');
    }
  };

  useEffect(() => {
    if (student?.walletAddress) {
      fetchStudentBalance();
    }
  }, [student]);

  const handleTransfer = async (data: TransferFormData) => {
    if (!student || !isConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedReceiver) {
      toast.error('Please select a valid receiver');
      return;
    }

    try {
      setIsTransferring(true);

      // Convert amount to wei (DREX has 18 decimals like ETH)
      const amountWei = ethers.parseEther(data.amount.toString());
      
      // Check if student has sufficient balance
      const balanceWei = ethers.parseEther(studentBalance);
      if (amountWei > balanceWei) {
        toast.error('Insufficient balance');
        return;
      }

      // In a real implementation, this would interact with the vault smart contract
      // For now, we'll simulate the transfer and create a transaction record
      
      // 1. Call the vault contract's transfer function
      // const vaultContract = new ethers.Contract(vaultAddress, vaultABI, signer);
      // const tx = await vaultContract.transfer(data.receiverAddress, amountWei);
      // await tx.wait();

      // 2. Record the transaction in our backend
      const transactionData = {
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock hash
        fromAddress: account,
        toAddress: data.receiverAddress,
        amount: data.amount.toString(),
        timestamp: new Date().toISOString(),
        blockNumber: Math.floor(Math.random() * 1000000).toString(),
        studentAddress: account,
        receiverAddress: data.receiverAddress,
        expenseTypeId: data.expenseTypeId ? parseInt(data.expenseTypeId) : undefined,
      };

      // Here you would call your backend API to record the transaction
      console.log('Transaction data:', transactionData);

      // Update local balance
      const newBalance = (parseFloat(studentBalance) - data.amount).toFixed(2);
      setStudentBalance(newBalance);

      toast.success(`Successfully transferred R$ ${data.amount.toFixed(2)} to ${selectedReceiver.name || 'receiver'}`);
      reset();
      
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error('Transfer failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsTransferring(false);
    }
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Transfer DREX</h1>
        <p className="text-secondary-600">
          Send DREX to verified receivers using your monthly allowance
        </p>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700">Available Balance</p>
              <p className="text-3xl font-bold text-primary-900">
                R$ {parseFloat(studentBalance).toFixed(2)}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                Monthly Allowance: R$ {parseFloat(student.monthlyAmount).toFixed(2)}
              </p>
            </div>
            <div className="h-16 w-16 bg-primary-200 rounded-full flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-primary-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">New Transfer</h2>
          <p className="text-sm text-secondary-600">Send DREX to a verified receiver</p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(handleTransfer)} className="space-y-6">
            {/* Receiver Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Select Receiver
              </label>
              {isLoadingReceivers ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-secondary-600">Loading receivers...</span>
                </div>
              ) : (
                <select
                  {...register('receiverAddress')}
                  className="input"
                  disabled={isTransferring}
                >
                  <option value="">Choose a receiver...</option>
                  {receivers.map((receiver) => (
                    <option key={receiver.address} value={receiver.address}>
                      {receiver.name || receiver.address} - {receiver.type}
                    </option>
                  ))}
                </select>
              )}
              {errors.receiverAddress && (
                <p className="mt-1 text-sm text-error-600">{errors.receiverAddress.message}</p>
              )}
            </div>

            {/* Selected Receiver Info */}
            {selectedReceiver && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="font-medium text-green-800">
                      {selectedReceiver.name || 'Unnamed Receiver'}
                    </p>
                    <p className="text-sm text-green-600">
                      Type: {selectedReceiver.type} • Verified Receiver
                    </p>
                    <p className="text-xs text-green-500 font-mono mt-1">
                      {selectedReceiver.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Amount (DREX)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-secondary-500 text-sm">R$</span>
                </div>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={studentBalance}
                  className="input pl-10"
                  placeholder="0.00"
                  disabled={isTransferring}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-error-600">{errors.amount.message}</p>
              )}
              <p className="mt-1 text-xs text-secondary-500">
                Maximum: R$ {parseFloat(studentBalance).toFixed(2)}
              </p>
            </div>

            {/* Expense Type (Optional) */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Category (Optional)
              </label>
              <select
                {...register('expenseTypeId')}
                className="input"
                disabled={isTransferring}
              >
                <option value="">Select category...</option>
                <option value="1">Food</option>
                <option value="2">Transportation</option>
                <option value="3">Books & Supplies</option>
                <option value="4">Healthcare</option>
                <option value="5">Other</option>
              </select>
            </div>

            {/* Wallet Connection Warning */}
            {!isConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Please connect your MetaMask wallet to make transfers
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isTransferring || !isConnected || !selectedReceiver}
              className="btn btn-primary btn-lg w-full"
            >
              {isTransferring ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing Transfer...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Transfer
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Transfers</h2>
          <p className="text-sm text-secondary-600">Your recent DREX transactions</p>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <ArrowLeftRight className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No recent transfers</p>
            <p className="text-sm text-secondary-500">Your transfer history will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTransferPage; 