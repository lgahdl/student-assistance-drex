import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Users, Plus, Eye, Edit, Trash2, Copy, X } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Student } from '../types';
import { formatWalletAddress, formatCurrency, formatDate, copyTextToClipboard } from '../utils';
import toast from 'react-hot-toast';

interface StudentRegistrationForm {
  walletAddress: string;
  name: string;
  cpf: string;
  university: string;
  monthlyAmount: number;
}

const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState<StudentRegistrationForm>({
    walletAddress: '',
    name: '',
    cpf: '',
    university: '',
    monthlyAmount: 0,
  });

  const queryClient = useQueryClient();

  const { data: studentsResponse, isLoading, error, refetch } = useQuery(
    'students',
    () => apiService.getStudents(),
    {
      refetchOnWindowFocus: false,
    }
  );

  const registerStudentMutation = useMutation(
    (studentData: StudentRegistrationForm) => apiService.createStudent(studentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students');
        setShowRegistrationModal(false);
        setRegistrationForm({
          walletAddress: '',
          name: '',
          cpf: '',
          university: '',
          monthlyAmount: 0,
        });
        toast.success('Student registered successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to register student');
      },
    }
  );

  const students = studentsResponse?.data?.items || [];

  const filteredStudents = students.filter((student: Student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyAddress = async (address: string) => {
    const success = await copyTextToClipboard(address);
    if (success) {
      toast.success('Wallet address copied to clipboard');
    } else {
      toast.error('Failed to copy address');
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerStudentMutation.mutate(registrationForm);
  };

  const fillMetaMaskAddresses = () => {
    setRegistrationForm({
      walletAddress: '0xA7868E049c067A49CD33726D3Edc4163a147B4Ad',
      name: 'Test Student',
      cpf: '12345678901',
      university: 'UFSC',
      monthlyAmount: 500,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600">Manage student accounts and spending limits</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Users className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Error loading students</h3>
              <p className="mt-1 text-sm text-gray-500">
                Failed to load students from the server. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 btn btn-primary btn-md"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage student accounts and spending limits</p>
        </div>
        <button 
          onClick={() => setShowRegistrationModal(true)}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search students by name, address, or university..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-md">
                Active Only
              </button>
              <button className="btn btn-secondary btn-md">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">
            Students ({filteredStudents.length})
          </h2>
          <p className="text-sm text-gray-600">
            {filteredStudents.length === students.length 
              ? `Showing all ${students.length} students`
              : `Showing ${filteredStudents.length} of ${students.length} students`
            }
          </p>
        </div>
        <div className="card-content p-0">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No students found' : 'No students yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first student to the system'
                }
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => setShowRegistrationModal(true)}
                  className="mt-4 btn btn-primary btn-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Limit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student: Student) => (
                    <tr key={student.walletAddress} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              CPF: {student.cpf}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-900">
                            {formatWalletAddress(student.walletAddress)}
                          </span>
                          <button
                            onClick={() => handleCopyAddress(student.walletAddress)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy full address"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.university}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(student.monthlyAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${student.active ? 'badge-success' : 'badge-error'}`}>
                          {student.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Delete student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Register New Student</h3>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegistrationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.walletAddress}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, walletAddress: e.target.value }))}
                  className="input w-full"
                  placeholder="0x..."
                />
                <button
                  type="button"
                  onClick={fillMetaMaskAddresses}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  Use MetaMask test address
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="Student's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.cpf}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, cpf: e.target.value }))}
                  className="input w-full"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.university}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, university: e.target.value }))}
                  className="input w-full"
                  placeholder="University name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Amount (BRL)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={registrationForm.monthlyAmount}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, monthlyAmount: parseFloat(e.target.value) || 0 }))}
                  className="input w-full"
                  placeholder="500.00"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerStudentMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  {registerStudentMutation.isLoading ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage; 