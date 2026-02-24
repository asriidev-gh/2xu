'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { RACE_CATEGORY_NAMES } from '@/components/RaceCategoriesSection';

interface User {
  _id: string;
  name: string;
  email: string;
  contact: string;
  gender: string;
  birthday: string;
  raceCategory: string;
  affiliations: string;
  promotional: boolean;
  tShirtSize?: string;
  teamId?: string;
  teamMemberIndex?: number;
  createdAt: string;
}

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function formatDateForExport(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function exportToExcel(
  pagination: { total: number },
  filters: Record<string, string>
) {
  if (pagination.total === 0) {
    Swal.fire({
      title: 'No Data',
      text: 'There are no users to export.',
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ea580c'
    });
    return;
  }

  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    queryParams.set('page', '1');
    queryParams.set('limit', String(Math.max(pagination.total, 10000)));
    const response = await fetch(`/api/users?${queryParams.toString()}`);
    const data = await response.json();
    const allUsers = (response.ok && data.users) ? data.users : [];
    if (allUsers.length === 0) {
      Swal.fire({
        title: 'No Data',
        text: 'There are no users to export.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c'
      });
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Contact',
      'Gender',
      'Birthday',
      'Race Experience',
      'T-shirt Size',
      'Club/Organization',
      'Promotional Emails',
      'Registration Date'
    ];

    const rows = allUsers.map((user: User) => [
      user.name,
      user.email,
      user.contact,
      user.gender,
      user.birthday || '',
      user.raceCategory || '',
      user.tShirtSize || '',
      user.affiliations || '',
      user.promotional ? 'Yes' : 'No',
      formatDateForExport(user.createdAt)
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered Users');

    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    link.setAttribute('download', `2xu-registered-users-${dateStr}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Swal.fire({
      title: 'Success!',
      text: `Exported ${allUsers.length} user(s) to Excel`,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ea580c',
      timer: 2000
    });
  } catch (err) {
    Swal.fire({
      title: 'Error',
      text: 'Failed to export. Please try again.',
      icon: 'error',
      confirmButtonColor: '#ea580c'
    });
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteUserEnabled, setDeleteUserEnabled] = useState(false);
  const [editingTShirtSizeUserId, setEditingTShirtSizeUserId] = useState<string | null>(null);
  const [savingTShirtSizeUserId, setSavingTShirtSizeUserId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    gender: '',
    raceCategory: '',
    club: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters.name, filters.email, filters.gender, filters.raceCategory, filters.club, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    fetchUsers();
    fetchConfig();
  }, [filters, pagination.page, pagination.limit]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/users/config');
      if (response.ok) {
        const data = await response.json();
        setDeleteUserEnabled(data.deleteUserEnabled || false);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.set('page', String(pagination.page));
      queryParams.set('limit', String(pagination.limit));

      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (response.status === 401) {
        // Unauthorized - redirect to login
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
        setPagination((prev) => ({
          ...prev,
          total: data.total ?? 0,
          totalPages: data.totalPages ?? 1,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load users. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTShirtSizeChange = async (userId: string, newSize: string) => {
    setSavingTShirtSizeUserId(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tShirtSize: newSize }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update');
      setUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, tShirtSize: newSize } : u))
      );
      setEditingTShirtSizeUserId(null);
      await Swal.fire({
        title: 'Updated',
        text: newSize ? `T-shirt size set to ${newSize}` : 'T-shirt size cleared.',
        icon: 'success',
        confirmButtonColor: '#ea580c',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to update T-shirt size',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setSavingTShirtSizeUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user "${userName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Show success message
      await Swal.fire({
        title: 'Deleted!',
        text: 'User has been deleted successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        allowOutsideClick: false,
        allowEscapeKey: false
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Delete error:', error);
      await Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to delete user. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 font-druk">User Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-fira-sans"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 font-druk">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Search by name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Email</label>
              <input
                type="text"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Search by email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Race Experience</label>
              <select
                value={filters.raceCategory}
                onChange={(e) => handleFilterChange('raceCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              >
                <option value="">All</option>
                {RACE_CATEGORY_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Club/Organization</label>
              <input
                type="text"
                value={filters.club}
                onChange={(e) => handleFilterChange('club', e.target.value)}
                placeholder="Search by club"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 font-druk">
              Registered Users ({pagination.total})
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 font-sweet-sans">
                Per page
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const limit = Number(e.target.value);
                    setPagination((prev) => ({ ...prev, limit, page: 1 }));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            {users.length > 0 && (
              <button
                onClick={() => exportToExcel(pagination, filters)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-fira-sans flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
            )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-sweet-sans">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-sweet-sans">No users found</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Birthday</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Race Experience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">T-shirt Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Club/Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Promotional</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Registered</th>
                    {deleteUserEnabled && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-sweet-sans">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.contact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.gender}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.birthday || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.raceCategory || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                        {editingTShirtSizeUserId === user._id ? (
                          <select
                            value={user.tShirtSize || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              handleTShirtSizeChange(user._id, v);
                            }}
                            onBlur={() => setEditingTShirtSizeUserId(null)}
                            autoFocus
                            disabled={savingTShirtSizeUserId === user._id}
                            className="px-2 py-1 border border-orange-500 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm min-w-[4rem]"
                          >
                            <option value="">No size selected yet</option>
                            {T_SHIRT_SIZES.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            {user.tShirtSize ? (
                              <span>{user.tShirtSize}</span>
                            ) : (
                              <span className="text-gray-400">No Size Selected Yet</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingTShirtSizeUserId(user._id)}
                              className="p-0.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Edit T-shirt size"
                              aria-label="Edit T-shirt size"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.affiliations || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                        {user.promotional ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{formatDate(user.createdAt)}</td>
                      {deleteUserEnabled && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="text-red-600 hover:text-red-900 transition-colors font-fira-sans"
                            title="Delete user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-gray-600 font-sweet-sans">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-fira-sans"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 font-sweet-sans px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-fira-sans"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

