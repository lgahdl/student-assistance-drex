import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Users, 
  Send, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Clock,
  Wallet
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const fundVaultSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0.01'),
});

const distributeBatchSchema = z.object({
  startIndex: z.number().min(0, 'Start index must be 0 or greater'),
  endIndex: z.number().min(1, 'End index must be greater than start index'),
});

type FundVaultFormData = z.infer<typeof fundVaultSchema>;
type DistributeBatchFormData = z.infer<typeof distributeBatchSchema>;

interface VaultStats {
  contractBalance: string;
  totalExpectedAmount: string;
  totalDistributedAmount: string;
  studentCount: number;
  lastDistributionTimestamp: string;
  maxBatchSize: number;
}

interface StudentInfo {
  address: string;
  monthlyAmount: string;
  balance: string;
  isActive: boolean;
  name?: string;
}

const VaultManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [vaultStats, setVaultStats] = useState<VaultStats | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const fundForm = useForm<FundVaultFormData>({
    resolver: zodResolver(fundVaultSchema),
  });

  const batchForm = useForm<DistributeBatchFormData>({
    resolver: zodResolver(distributeBatchSchema),
  });

  // Mock vault contract addresses - in real implementation, these would come from config
  // const VAULT_ADDRESS = "0x1234567890123456789012345678901234567890";
  // const DREX_TOKEN_ADDRESS = "0x0987654321098765432109876543210987654321";

  // Fetch vault statistics
  const fetchVaultStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // In real implementation, this would call the smart contract
      // const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, provider);
      // const [contractBalance, totalExpected, totalDistributed, studentCount, lastDistribution] = await Promise.all([
      //   vaultContract.getContractBalance(),
      //   vaultContract.getTotalExpectedAmount(),
      //   vaultContract.getTotalDistributedAmount(),
      //   vaultContract.getStudentCount(),
      //   vaultContract.lastDistributionTimestamp()
      // ]);

      // Mock data for demonstration
      const mockStats: VaultStats = {
        contractBalance: "10000.00",
        totalExpectedAmount: "1550.00",
        totalDistributedAmount: "1550.00",
        studentCount: 3,
        lastDistributionTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        maxBatchSize: 50,
      };

      setVaultStats(mockStats);
    } catch (error) {
      console.error('Error fetching vault stats:', error);
      toast.error('Failed to load vault statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch student information
  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      
      // In real implementation, this would call the smart contract and backend
      // const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, provider);
      // const studentCount = await vaultContract.getStudentCount();
      // const studentsData = [];
      // for (let i = 0; i < studentCount; i++) {
      //   const studentAddr = await vaultContract.getStudentAtIndex(i);
      //   const studentInfo = await vaultContract.getStudentInfo(studentAddr);
      //   const balance = await vaultContract.getStudentBalance(studentAddr);
      //   studentsData.push({ ...studentInfo, balance });
      // }

      // Mock data for demonstration
      const mockStudents: StudentInfo[] = [
        {
          address: "0xA7868E049c067A49CD33726D3Edc4163a147B4Ad",
          monthlyAmount: "500.00",
          balance: "500.00",
          isActive: true,
          name: "João Silva"
        },
        {
          address: "0xB8979F149d068B50CD44737D4Fdc4264a248C5Ae",
          monthlyAmount: "600.00",
          balance: "600.00",
          isActive: true,
          name: "Maria Santos"
        },
        {
          address: "0xC9A8AF059e069C51DE55728E5Gec5375b349D6Bf",
          monthlyAmount: "450.00",
          balance: "450.00",
          isActive: true,
          name: "Pedro Costa"
        }
      ];

      setStudents(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student information');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchVaultStats();
    fetchStudents();
  }, []);

  const handleFundVault = async (data: FundVaultFormData) => {
    try {
      setIsFunding(true);

      // In real implementation:
      // 1. Connect to DREX token contract
      // 2. Approve vault to spend tokens
      // 3. Call vault.depositDrex(amount)
      
      // const drexContract = new ethers.Contract(DREX_TOKEN_ADDRESS, erc20ABI, signer);
      // const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, signer);
      // const amountWei = ethers.parseEther(data.amount.toString());
      // 
      // // Approve
      // const approveTx = await drexContract.approve(VAULT_ADDRESS, amountWei);
      // await approveTx.wait();
      // 
      // // Deposit
      // const depositTx = await vaultContract.depositDrex(amountWei);
      // await depositTx.wait();

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBalance = (parseFloat(vaultStats?.contractBalance || '0') + data.amount).toFixed(2);
      setVaultStats(prev => prev ? { ...prev, contractBalance: newBalance } : null);
      
      toast.success(`Successfully funded vault with R$ ${data.amount.toFixed(2)}`);
      fundForm.reset();
      
    } catch (error: any) {
      console.error('Funding error:', error);
      toast.error('Failed to fund vault: ' + (error.message || 'Unknown error'));
    } finally {
      setIsFunding(false);
    }
  };

  const handleDistributeAll = async () => {
    try {
      setIsDistributing(true);

      // In real implementation:
      // const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, signer);
      // const tx = await vaultContract.distributeMonthlyAllowances();
      // await tx.wait();

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 3000));

      setVaultStats(prev => prev ? {
        ...prev,
        totalDistributedAmount: (parseFloat(prev.totalDistributedAmount) + parseFloat(prev.totalExpectedAmount)).toFixed(2),
        lastDistributionTimestamp: new Date().toISOString()
      } : null);

      toast.success('Successfully distributed monthly allowances to all students');
      await fetchStudents(); // Refresh student balances
      
    } catch (error: any) {
      console.error('Distribution error:', error);
      toast.error('Failed to distribute allowances: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDistributing(false);
    }
  };

  const handleDistributeBatch = async (data: DistributeBatchFormData) => {
    try {
      setIsDistributing(true);

      // In real implementation:
      // const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, signer);
      // const tx = await vaultContract.distributeBatch(data.startIndex, data.endIndex);
      // await tx.wait();

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 2000));

      const batchSize = data.endIndex - data.startIndex;
      toast.success(`Successfully distributed allowances to ${batchSize} students`);
      batchForm.reset();
      await fetchStudents(); // Refresh student balances
      
    } catch (error: any) {
      console.error('Batch distribution error:', error);
      toast.error('Failed to distribute batch: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDistributing(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">Access denied. Admin role required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Vault Management</h1>
        <p className="text-secondary-600">
          Manage DREX distribution and monitor vault status
        </p>
      </div>

      {/* Vault Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Vault Balance</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {isLoadingStats ? '...' : `R$ ${parseFloat(vaultStats?.contractBalance || '0').toFixed(2)}`}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Monthly Required</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {isLoadingStats ? '...' : `R$ ${parseFloat(vaultStats?.totalExpectedAmount || '0').toFixed(2)}`}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Distributed</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {isLoadingStats ? '...' : `R$ ${parseFloat(vaultStats?.totalDistributedAmount || '0').toFixed(2)}`}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Active Students</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {isLoadingStats ? '...' : vaultStats?.studentCount || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Distribution Info */}
      {vaultStats && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Last Distribution</p>
                  <p className="text-sm text-blue-700">
                    {formatTimeAgo(vaultStats.lastDistributionTimestamp)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchVaultStats();
                  fetchStudents();
                }}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Vault */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">Fund Vault</h2>
            <p className="text-sm text-secondary-600">Add DREX tokens to the vault</p>
          </div>
          <div className="card-content">
            <form onSubmit={fundForm.handleSubmit(handleFundVault)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Amount (DREX)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-secondary-500 text-sm">R$</span>
                  </div>
                  <input
                    {...fundForm.register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input pl-10"
                    placeholder="0.00"
                    disabled={isFunding}
                  />
                </div>
                {fundForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-error-600">
                    {fundForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isFunding}
                className="btn btn-primary btn-lg w-full"
              >
                {isFunding ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Funding Vault...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Fund Vault
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Distribution Controls */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">Distribution Controls</h2>
            <p className="text-sm text-secondary-600">Distribute monthly allowances</p>
          </div>
          <div className="card-content space-y-4">
            {/* Distribute All */}
            <button
              onClick={handleDistributeAll}
              disabled={isDistributing}
              className="btn btn-success btn-lg w-full"
            >
              {isDistributing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Distributing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Distribute to All Students
                </>
              )}
            </button>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Batch Distribution</h3>
              <form onSubmit={batchForm.handleSubmit(handleDistributeBatch)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1">
                      Start Index
                    </label>
                    <input
                      {...batchForm.register('startIndex', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max={Math.max(0, (vaultStats?.studentCount || 1) - 1)}
                      className="input text-sm"
                      placeholder="0"
                      disabled={isDistributing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1">
                      End Index
                    </label>
                    <input
                      {...batchForm.register('endIndex', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max={vaultStats?.studentCount || 1}
                      className="input text-sm"
                      placeholder={vaultStats?.studentCount?.toString() || "1"}
                      disabled={isDistributing}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isDistributing}
                  className="btn btn-secondary w-full"
                >
                  Distribute Batch
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Student Balances */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Student Balances</h2>
          <p className="text-sm text-secondary-600">Monitor individual student vault balances</p>
        </div>
        <div className="card-content">
          {isLoadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-secondary-600">Loading student information...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Monthly Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Current Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {students.map((student, index) => (
                    <tr key={student.address} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {student.name || `Student ${index + 1}`}
                          </div>
                          <div className="text-sm text-secondary-500 font-mono">
                            {student.address.slice(0, 6)}...{student.address.slice(-4)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        R$ {parseFloat(student.monthlyAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        R$ {parseFloat(student.balance).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultManagementPage; 