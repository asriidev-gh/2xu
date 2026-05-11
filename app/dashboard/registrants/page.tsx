'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { RACE_CATEGORY_NAMES } from '@/components/RaceCategoriesSection';
import DashboardAdminHeader from '@/components/DashboardAdminHeader';

interface User {
  _id: string;
  name: string;
  email: string;
  contact: string;
  gender: string;
  birthday: string;
  raceCategory: string;
  patronSpeedDistance?: string;
  affiliations: string;
  promotional: boolean;
  promoCode?: string;
  tShirtSize?: string;
  teamId?: string;
  teamMemberIndex?: number;
  mailerStatus?: 'success' | 'failed' | 'pending';
  mailerLastAttemptAt?: string | null;
  mailerLastError?: string | null;
  createdAt: string;
}

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const dashboardFieldClass =
  'w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm font-sweet-sans text-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500';

function formatRaceCategoryLabel(raceCategory: string, patronSpeedDistance?: string) {
  const base = raceCategory?.trim() || '';
  if (base !== 'Patron') return base;
  const speed = patronSpeedDistance?.trim();
  return speed ? `Patron (${speed})` : base;
}

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

type DashboardSortField =
  | 'name'
  | 'email'
  | 'contact'
  | 'gender'
  | 'birthday'
  | 'raceCategory'
  | 'tShirtSize'
  | 'affiliations'
  | 'promoCode'
  | 'promotional'
  | 'mailerStatus'
  | 'createdAt';

/** Sort fields that map to columns hidden in compact view (7 core columns + optional Actions). */
const COMPACT_HIDDEN_SORT_FIELDS = new Set<DashboardSortField>([
  'birthday',
  'tShirtSize',
  'affiliations',
  'promoCode',
  'promotional',
]);

function SortableTh({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
}: {
  field: DashboardSortField;
  label: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: DashboardSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider font-fira-sans align-bottom"
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1.5 -mx-1 px-1.5 py-1 rounded-md cursor-pointer hover:bg-orange-50/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
          active ? 'text-orange-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
        }`}
        title={
          active
            ? sortDir === 'asc'
              ? 'Sorted ascending; click for descending'
              : 'Sorted descending; click for ascending'
            : 'Sort by this column'
        }
      >
        <span>{label}</span>
        <span className="inline-flex w-3 justify-center text-[10px] leading-none tabular-nums" aria-hidden>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : null}
        </span>
      </button>
    </th>
  );
}

async function exportToExcel(
  pagination: { total: number },
  filters: Record<string, string>,
  sortBy: string,
  sortDir: 'asc' | 'desc'
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
    queryParams.set('sortBy', sortBy);
    queryParams.set('sortDir', sortDir);
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
      'Advocate Code',
      'Promotional Emails',
      'Email Status',
      'Registration Date'
    ];

    const rows = allUsers.map((user: User) => [
      user.name,
      user.email,
      user.contact,
      user.gender,
      user.birthday || '',
      formatRaceCategoryLabel(user.raceCategory, user.patronSpeedDistance),
      user.tShirtSize || '',
      user.affiliations || '',
      user.promoCode || '',
      user.promotional ? 'Yes' : 'No',
      user.mailerStatus || 'pending',
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
  const [emailBlastEnabled, setEmailBlastEnabled] = useState(false);
  const [editingTShirtSizeUserId, setEditingTShirtSizeUserId] = useState<string | null>(null);
  const [savingTShirtSizeUserId, setSavingTShirtSizeUserId] = useState<string | null>(null);
  const [retryingMailerUserId, setRetryingMailerUserId] = useState<string | null>(null);
  const [clubAffiliationOptions, setClubAffiliationOptions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [sortBy, setSortBy] = useState<DashboardSortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  /** When false, hide 5 middle columns so the grid stays readable (core 7 + Actions). */
  const [showExtraTableColumns, setShowExtraTableColumns] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    gender: '',
    raceCategory: '',
    club: '',
    promoCode: '',
    emailStatus: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters.name, filters.email, filters.gender, filters.raceCategory, filters.club, filters.promoCode, filters.emailStatus, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    if (!showExtraTableColumns && COMPACT_HIDDEN_SORT_FIELDS.has(sortBy)) {
      setSortBy('createdAt');
      setSortDir('desc');
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [showExtraTableColumns, sortBy]);

  useEffect(() => {
    fetchUsers();
    fetchConfig();
  }, [filters, pagination.page, pagination.limit, sortBy, sortDir]);

  useEffect(() => {
    const loadAffiliations = async () => {
      try {
        const response = await fetch('/api/users/affiliations');
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        setClubAffiliationOptions(Array.isArray(data.affiliations) ? data.affiliations : []);
      } catch {
        setClubAffiliationOptions([]);
      }
    };
    loadAffiliations();
  }, [router]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/users/config');
      if (response.ok) {
        const data = await response.json();
        setDeleteUserEnabled(data.deleteUserEnabled || false);
        setEmailBlastEnabled(data.emailBlastEnabled === true);
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
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortDir', sortDir);

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

  const handleSortColumn = (field: DashboardSortField) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    // Do not call setSortDir inside setSortBy's updater — React Strict Mode runs that
    // updater twice in dev, which would flip sort direction twice (appears broken).
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'createdAt' ? 'desc' : 'asc');
    }
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

  const handleRetryMailer = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'Retry registration email?',
      text: `Retry confirmation email for "${userName}" now?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Retry',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    setRetryingMailerUserId(userId);
    try {
      const response = await fetch(`/api/users/${userId}/retry-mailer`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(
          data.mailerLastError || data.error || 'Failed to retry registration email'
        );
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                mailerStatus: 'success',
                mailerLastAttemptAt: new Date().toISOString(),
                mailerLastError: null,
              }
            : u
        )
      );
      await Swal.fire({
        title: 'Retry sent',
        text: 'Registration confirmation email was sent successfully.',
        icon: 'success',
        confirmButtonColor: '#ea580c',
      });
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                mailerStatus: 'failed',
                mailerLastAttemptAt: new Date().toISOString(),
                mailerLastError:
                  error instanceof Error && error.message
                    ? error.message
                    : u.mailerLastError || 'Unknown mailer error',
              }
            : u
        )
      );
      await Swal.fire({
        title: 'Retry failed',
        text: error instanceof Error ? error.message : 'Failed to retry registration email',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setRetryingMailerUserId(null);
      fetchUsers();
    }
  };

  const showMailerError = async (user: User) => {
    await Swal.fire({
      title: `Email failure: ${user.name}`,
      text: user.mailerLastError || 'No error details were captured for this record.',
      icon: 'info',
      confirmButtonColor: '#ea580c',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100/90 text-gray-900">
      <DashboardAdminHeader emailBlastEnabled={emailBlastEnabled} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-12">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200/60 p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
            <h2 className="text-lg font-semibold text-gray-900 font-druk tracking-tight">Filters</h2>
            <p className="text-xs text-gray-500 font-sweet-sans sm:text-right max-w-md">
              Narrow the list below; filters apply as you type or change a field.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-x-4 gap-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Search by name"
                className={dashboardFieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Email</label>
              <input
                type="text"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Search by email"
                className={dashboardFieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className={dashboardFieldClass}
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Race Experience</label>
              <select
                value={filters.raceCategory}
                onChange={(e) => handleFilterChange('raceCategory', e.target.value)}
                className={dashboardFieldClass}
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
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Club/Organization</label>
              <select
                value={filters.club}
                onChange={(e) => handleFilterChange('club', e.target.value)}
                className={`${dashboardFieldClass} max-w-full`}
                title={filters.club || undefined}
              >
                <option value="">All</option>
                {clubAffiliationOptions.map((name) => (
                  <option key={name} value={name} title={name}>
                    {name.length > 48 ? `${name.slice(0, 45)}…` : name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Advocate Code</label>
              <input
                type="text"
                value={filters.promoCode}
                onChange={(e) => handleFilterChange('promoCode', e.target.value.toUpperCase())}
                placeholder="Filter by advocate code"
                maxLength={6}
                className={`${dashboardFieldClass} uppercase tracking-wide`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Email Status</label>
              <select
                value={filters.emailStatus}
                onChange={(e) => handleFilterChange('emailStatus', e.target.value)}
                className={dashboardFieldClass}
              >
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={dashboardFieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-fira-sans">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={dashboardFieldClass}
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200/60 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/90 bg-gradient-to-r from-gray-50/80 to-white flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 font-druk tracking-tight">
                Registered users
                <span className="text-orange-600 font-normal"> ({pagination.total})</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-sweet-sans mt-1.5 max-w-xl leading-relaxed">
                {showExtraTableColumns
                  ? 'Showing all columns.'
                  : 'Compact view: 7 columns. Use “More columns” for birthday, kit, club, advocate & promo.'}
              </p>
            </div>
            <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowExtraTableColumns((v) => !v)}
                aria-expanded={showExtraTableColumns}
                className="px-3 py-2 rounded-lg border border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100/90 transition-colors font-fira-sans text-sm font-medium whitespace-nowrap"
              >
                {showExtraTableColumns ? 'Fewer columns' : 'More columns'}
              </button>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 font-sweet-sans px-1">
                <span className="whitespace-nowrap">Per page</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const limit = Number(e.target.value);
                    setPagination((prev) => ({ ...prev, limit, page: 1 }));
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-sweet-sans text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 min-w-[4.5rem]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            {users.length > 0 && (
              <button
                type="button"
                onClick={() => exportToExcel(pagination, filters, sortBy, sortDir)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-fira-sans text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
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
            <div className="px-6 py-16 text-center bg-gray-50/40">
              <p className="text-gray-500 font-sweet-sans text-sm sm:text-base">Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center bg-gray-50/40 border-t border-gray-100">
              <p className="text-gray-500 font-sweet-sans text-sm sm:text-base">No users match these filters.</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/95 border-b border-gray-200/90">
                  <tr>
                    <SortableTh field="name" label="Name" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    <SortableTh field="email" label="Email" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    <SortableTh field="contact" label="Contact" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    <SortableTh field="gender" label="Gender" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    {showExtraTableColumns && (
                      <SortableTh field="birthday" label="Birthday" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    )}
                    <SortableTh
                      field="raceCategory"
                      label="Race Experience"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSortColumn}
                    />
                    {showExtraTableColumns && (
                      <>
                        <SortableTh field="tShirtSize" label="T-shirt Size" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                        <SortableTh
                          field="affiliations"
                          label="Club/Organization"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSortColumn}
                        />
                        <SortableTh field="promoCode" label="Advocate Code" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                        <SortableTh field="promotional" label="Promotional" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                      </>
                    )}
                    <SortableTh field="mailerStatus" label="Email Status" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    <SortableTh field="createdAt" label="Registered" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    {deleteUserEnabled && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const raceExperience = formatRaceCategoryLabel(
                      user.raceCategory,
                      user.patronSpeedDistance
                    );
                    return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td
                        className={`px-6 py-4 text-sm font-medium text-gray-900 font-sweet-sans ${
                          showExtraTableColumns ? 'whitespace-nowrap' : 'max-w-[9rem] sm:max-w-[11rem] truncate whitespace-nowrap'
                        }`}
                        title={user.name}
                      >
                        {user.name}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-gray-500 font-sweet-sans ${
                          showExtraTableColumns ? 'whitespace-nowrap' : 'max-w-[9rem] sm:max-w-[12rem] truncate whitespace-nowrap'
                        }`}
                        title={user.email}
                      >
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.contact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.gender}</td>
                      {showExtraTableColumns && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.birthday || 'N/A'}</td>
                      )}
                      <td
                        className={`px-6 py-4 text-sm text-gray-500 font-sweet-sans ${
                          showExtraTableColumns ? 'whitespace-nowrap' : 'max-w-[10rem] sm:max-w-[14rem] truncate whitespace-nowrap'
                        }`}
                        title={raceExperience || undefined}
                      >
                        {raceExperience || 'N/A'}
                      </td>
                      {showExtraTableColumns && (
                        <>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">{user.promoCode || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                            {user.promotional ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">No</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                        <div className="flex items-center gap-2">
                          {user.mailerStatus === 'success' ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">success</span>
                          ) : user.mailerStatus === 'failed' ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">failed</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">pending</span>
                          )}
                          {user.mailerStatus === 'failed' && (
                            <button
                              type="button"
                              onClick={() => showMailerError(user)}
                              className="px-2 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                              title="View failure reason"
                            >
                              Reason
                            </button>
                          )}
                          {user.mailerStatus === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryMailer(user._id, user.name)}
                              disabled={retryingMailerUserId === user._id}
                              className="px-2 py-1 text-xs font-semibold rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {retryingMailerUserId === user._id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </div>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200/90 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-gray-600 font-sweet-sans">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-fira-sans transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 font-sweet-sans px-2 tabular-nums">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-fira-sans transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}

