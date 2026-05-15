'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { RACE_CATEGORY_NAMES } from '@/components/RaceCategoriesSection';
import DashboardAdminHeader from '@/components/DashboardAdminHeader';
import { formatCompletedAgeLabel, getAgeYearsFromBirthday } from '@/lib/completedAge';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

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
  signupContext?: {
    ip: string;
    locationLabel: string;
    deviceType: string;
    userAgent: string;
  };
  createdAt: string;
}

type MailerEmailPreviewState = {
  subject: string;
  html: string;
  text: string;
  capturedAt: string | null;
  mailerStatus: 'success' | 'failed' | 'pending';
  mailerLastAttemptAt: string | null;
  mailerLastError: string | null;
};

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

/** Sort fields that map to columns hidden in compact view (core columns + optional Actions). */
const COMPACT_HIDDEN_SORT_FIELDS = new Set<DashboardSortField>([
  'contact',
  'birthday',
  'tShirtSize',
  'affiliations',
  'promoCode',
  'promotional',
]);

/** Age filter slider endpoints (inclusive). Full span = no API age filter. */
const AGE_SLIDER_MIN = 10;
const AGE_SLIDER_MAX = 80;

const ageDualRangeTrack =
  '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent ' +
  '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent';

const ageDualRangeThumb =
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white ' +
  '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:-mt-1 ' +
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:bg-orange-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md ' +
  '[&::-moz-range-thumb]:cursor-grab';

function AgeDualRangeSlider({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: number;
  max: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  const lo = AGE_SLIDER_MIN;
  const hi = AGE_SLIDER_MAX;
  const span = hi - lo;
  const leftPct = span > 0 ? ((min - lo) / span) * 100 : 0;
  const widthPct = span > 0 ? Math.max(0, ((max - min) / span) * 100) : 0;
  /** Let the handle farther from its track end sit on top so both stay grabbable when values are close. */
  const mid = lo + hi;
  const zMin = min + max <= mid ? 30 : 20;
  const zMax = min + max <= mid ? 20 : 30;

  return (
    <div className="relative w-full pt-1 pb-7">
      <div
        className="absolute left-0 right-0 top-[18px] h-2 rounded-full bg-gray-200"
        aria-hidden
      />
      <div
        className="absolute top-[18px] h-2 rounded-full bg-orange-400 pointer-events-none"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        aria-hidden
      />
      <input
        type="range"
        min={lo}
        max={hi}
        value={min}
        aria-label="Minimum age"
        onChange={(e) => {
          const v = Number(e.target.value);
          onMinChange(v <= max ? v : max);
        }}
        style={{ zIndex: zMin }}
        className={`absolute inset-x-0 top-2.5 w-full h-8 appearance-none bg-transparent pointer-events-none ${ageDualRangeTrack} ${ageDualRangeThumb}`}
      />
      <input
        type="range"
        min={lo}
        max={hi}
        value={max}
        aria-label="Maximum age"
        onChange={(e) => {
          const v = Number(e.target.value);
          onMaxChange(v >= min ? v : min);
        }}
        style={{ zIndex: zMax }}
        className={`absolute inset-x-0 top-2.5 w-full h-8 appearance-none bg-transparent pointer-events-none ${ageDualRangeTrack} ${ageDualRangeThumb}`}
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 font-sweet-sans tabular-nums">
        <span>{min} yrs old</span>
        <span>{max} yrs old</span>
      </div>
    </div>
  );
}

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

function buildRegistrantsFilterQueryString(
  filters: Record<string, string>,
  ageRangeMin: number,
  ageRangeMax: number
) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  if (ageRangeMin > AGE_SLIDER_MIN || ageRangeMax < AGE_SLIDER_MAX) {
    queryParams.set('ageMin', String(ageRangeMin));
    queryParams.set('ageMax', String(ageRangeMax));
  }
  return queryParams;
}

async function exportToExcel(
  pagination: { total: number },
  filters: Record<string, string>,
  sortBy: string,
  sortDir: 'asc' | 'desc',
  ageRangeMin: number,
  ageRangeMax: number
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
    const queryParams = buildRegistrantsFilterQueryString(filters, ageRangeMin, ageRangeMax);
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
      'Signup IP',
      'Signup Location',
      'Signup Device',
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
      user.signupContext?.ip || '',
      user.signupContext?.locationLabel || '',
      user.signupContext?.deviceType || '',
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
  const [registrantSendEmailEnabled, setRegistrantSendEmailEnabled] = useState(false);
  const [emailBlastEnabled, setEmailBlastEnabled] = useState(false);
  const [registrantsExportAllEmailsEnabled, setRegistrantsExportAllEmailsEnabled] = useState(false);
  const [allEmailsModalOpen, setAllEmailsModalOpen] = useState(false);
  const [allEmailsText, setAllEmailsText] = useState('');
  const [allEmailsCount, setAllEmailsCount] = useState(0);
  const [allEmailsLoading, setAllEmailsLoading] = useState(false);
  const [allEmailsError, setAllEmailsError] = useState<string | null>(null);
  const [allEmailsCopied, setAllEmailsCopied] = useState(false);
  const [editingTShirtSizeUserId, setEditingTShirtSizeUserId] = useState<string | null>(null);
  const [savingTShirtSizeUserId, setSavingTShirtSizeUserId] = useState<string | null>(null);
  const [retryingMailerUserId, setRetryingMailerUserId] = useState<string | null>(null);
  const [mailerPreviewOpen, setMailerPreviewOpen] = useState(false);
  const [mailerPreviewUser, setMailerPreviewUser] = useState<User | null>(null);
  const [mailerPreview, setMailerPreview] = useState<MailerEmailPreviewState | null>(null);
  const [mailerPreviewLoading, setMailerPreviewLoading] = useState(false);
  const [mailerPreviewError, setMailerPreviewError] = useState<string | null>(null);
  const [composeEmailOpen, setComposeEmailOpen] = useState(false);
  const [composeEmailUser, setComposeEmailUser] = useState<User | null>(null);
  const [composeEmailSubject, setComposeEmailSubject] = useState('');
  const [composeEmailHtml, setComposeEmailHtml] = useState('<p></p>');
  const [composeEmailSending, setComposeEmailSending] = useState(false);
  const [clubAffiliationOptions, setClubAffiliationOptions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [sortBy, setSortBy] = useState<DashboardSortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  /** When false, hide 5 middle columns so the grid stays readable (core 7 + Actions). */
  const [showExtraTableColumns, setShowExtraTableColumns] = useState(false);
  const [ageRangeMin, setAgeRangeMin] = useState(AGE_SLIDER_MIN);
  const [ageRangeMax, setAgeRangeMax] = useState(AGE_SLIDER_MAX);
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
  const [filtersSectionOpen, setFiltersSectionOpen] = useState(true);

  const appliedFilterCount = useMemo(() => {
    let n = 0;
    if (filters.name.trim()) n += 1;
    if (filters.email.trim()) n += 1;
    if (filters.gender) n += 1;
    if (filters.raceCategory) n += 1;
    if (filters.club) n += 1;
    if (filters.promoCode.trim()) n += 1;
    if (filters.emailStatus) n += 1;
    if (filters.dateFrom) n += 1;
    if (filters.dateTo) n += 1;
    if (ageRangeMin > AGE_SLIDER_MIN || ageRangeMax < AGE_SLIDER_MAX) n += 1;
    return n;
  }, [filters, ageRangeMin, ageRangeMax]);

  const composeEmailQuillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  );
  const composeEmailQuillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [
    filters.name,
    filters.email,
    filters.gender,
    filters.raceCategory,
    filters.club,
    filters.promoCode,
    filters.emailStatus,
    filters.dateFrom,
    filters.dateTo,
    ageRangeMin,
    ageRangeMax,
  ]);

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
  }, [filters, ageRangeMin, ageRangeMax, pagination.page, pagination.limit, sortBy, sortDir]);

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
        setRegistrantSendEmailEnabled(data.registrantSendEmailEnabled === true);
        setEmailBlastEnabled(data.emailBlastEnabled === true);
        setRegistrantsExportAllEmailsEnabled(data.registrantsExportAllEmailsEnabled === true);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const queryParams = buildRegistrantsFilterQueryString(filters, ageRangeMin, ageRangeMax);
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

  const closeAllEmailsModal = useCallback(() => {
    setAllEmailsModalOpen(false);
    setAllEmailsText('');
    setAllEmailsCount(0);
    setAllEmailsError(null);
    setAllEmailsLoading(false);
    setAllEmailsCopied(false);
  }, []);

  const handleOpenAllEmailsModal = useCallback(async () => {
    setAllEmailsModalOpen(true);
    setAllEmailsLoading(true);
    setAllEmailsError(null);
    setAllEmailsText('');
    setAllEmailsCount(0);
    setAllEmailsCopied(false);
    try {
      const qs = buildRegistrantsFilterQueryString(filters, ageRangeMin, ageRangeMax).toString();
      const response = await fetch(`/api/users/export-emails?${qs}`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = (await response.json()) as { commaSeparated?: string; count?: number; error?: string };
      if (!response.ok) {
        setAllEmailsError(data.error || 'Could not load emails.');
        return;
      }
      setAllEmailsText(typeof data.commaSeparated === 'string' ? data.commaSeparated : '');
      setAllEmailsCount(typeof data.count === 'number' ? data.count : 0);
    } catch {
      setAllEmailsError('Could not load emails.');
    } finally {
      setAllEmailsLoading(false);
    }
  }, [filters, ageRangeMin, ageRangeMax, router]);

  const handleCopyAllEmails = useCallback(async () => {
    if (!allEmailsText) return;
    try {
      await navigator.clipboard.writeText(allEmailsText);
      setAllEmailsCopied(true);
      window.setTimeout(() => setAllEmailsCopied(false), 2000);
    } catch {
      await Swal.fire({
        title: 'Copy failed',
        text: 'Your browser blocked clipboard access. Select the text and copy manually.',
        icon: 'info',
        confirmButtonColor: '#ea580c',
      });
    }
  }, [allEmailsText]);

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

  const closeMailerPreview = () => {
    setMailerPreviewOpen(false);
    setMailerPreviewUser(null);
    setMailerPreview(null);
    setMailerPreviewError(null);
    setMailerPreviewLoading(false);
  };

  const openMailerPreview = async (user: User) => {
    setMailerPreviewUser(user);
    setMailerPreviewOpen(true);
    setMailerPreviewLoading(true);
    setMailerPreviewError(null);
    setMailerPreview(null);

    try {
      const response = await fetch(`/api/users/${user._id}/mailer-preview`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load email preview');
      }
      setMailerPreview(data.preview as MailerEmailPreviewState);
    } catch (error) {
      setMailerPreviewError(
        error instanceof Error ? error.message : 'Failed to load email preview'
      );
    } finally {
      setMailerPreviewLoading(false);
    }
  };

  const mailerStatusButtonClass = (status: User['mailerStatus']) => {
    if (status === 'success') {
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
    if (status === 'failed') {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
  };

  const closeComposeEmail = () => {
    setComposeEmailOpen(false);
    setComposeEmailUser(null);
    setComposeEmailSubject('');
    setComposeEmailHtml('<p></p>');
  };

  const openComposeEmail = (user: User) => {
    setComposeEmailUser(user);
    setComposeEmailSubject('');
    setComposeEmailHtml(`<p>Dear ${user.name},</p><p><br></p>`);
    setComposeEmailOpen(true);
  };

  const handleSendComposedEmail = async () => {
    if (!composeEmailUser) return;

    const subject = composeEmailSubject.trim();
    const messageHtml = composeEmailHtml.trim();
    if (!subject) {
      await Swal.fire({
        title: 'Subject required',
        text: 'Please enter an email subject before sending.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }
    if (!messageHtml || messageHtml === '<p></p>' || messageHtml === '<p><br></p>') {
      await Swal.fire({
        title: 'Message required',
        text: 'Please compose an email message before sending.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }

    setComposeEmailSending(true);
    try {
      const response = await fetch(`/api/users/${composeEmailUser._id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, messageHtml }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      closeComposeEmail();
      await Swal.fire({
        title: 'Email sent',
        text: `Message sent to ${data.recipientEmail || composeEmailUser.email}.`,
        icon: 'success',
        confirmButtonColor: '#ea580c',
      });
    } catch (error) {
      await Swal.fire({
        title: 'Send failed',
        text: error instanceof Error ? error.message : 'Failed to send email',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setComposeEmailSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100/90 text-gray-900">
      <DashboardAdminHeader emailBlastEnabled={emailBlastEnabled} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-12">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200/60 mb-6 sm:mb-8 overflow-hidden">
          <div className="flex flex-row items-start justify-between gap-3 p-5 sm:p-6">
            <div className="min-w-0 flex-1">
              <h2
                id="registrants-filters-heading"
                className="text-lg font-semibold text-gray-900 font-druk tracking-tight"
              >
                Filters
              </h2>
              {filtersSectionOpen ? (
                <p className="text-xs text-gray-500 font-sweet-sans mt-1.5 max-w-xl leading-relaxed">
                  Narrow the list below; filters apply as you type or change a field.
                </p>
              ) : (
                <p className="text-xs text-gray-500 font-sweet-sans mt-1.5">
                  {appliedFilterCount > 0 ? (
                    <>
                      <span className="font-medium text-orange-700 tabular-nums">{appliedFilterCount}</span>{' '}
                      {appliedFilterCount === 1 ? 'filter' : 'filters'} active — open to edit.
                    </>
                  ) : (
                    <>Default view — open to narrow the list.</>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-expanded={filtersSectionOpen}
              aria-controls="registrants-filters-panel"
              onClick={() => setFiltersSectionOpen((v) => !v)}
              className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/80 text-gray-800 hover:bg-orange-50/90 hover:border-orange-200/80 transition-colors font-fira-sans text-sm font-medium"
            >
              <span>{filtersSectionOpen ? 'Hide' : 'Show'} filters</span>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  filtersSectionOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {filtersSectionOpen ? (
          <div
            id="registrants-filters-panel"
            role="region"
            aria-labelledby="registrants-filters-heading"
            className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 border-t border-gray-100"
          >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-x-4 gap-y-5 pt-5">
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
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-6 pt-2 border-t border-gray-100 mt-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-600 font-fira-sans">
                  Age <span className="font-normal text-gray-500">(completed years)</span>
                </label>
                <span className="text-sm text-orange-700 font-fira-sans font-semibold tabular-nums whitespace-nowrap">
                  {ageRangeMin} – {ageRangeMax}
                  {ageRangeMin === AGE_SLIDER_MIN && ageRangeMax === AGE_SLIDER_MAX ? (
                    <span className="font-normal text-gray-500 font-sweet-sans font-medium ml-1">
                      (all)
                    </span>
                  ) : null}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-sweet-sans mb-1">
                Drag either end of the bar to set the age range.
              </p>
              <AgeDualRangeSlider
                min={ageRangeMin}
                max={ageRangeMax}
                onMinChange={setAgeRangeMin}
                onMaxChange={setAgeRangeMax}
              />
            </div>
          </div>
          </div>
          ) : null}
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
                  : 'Compact view: 6 columns. Use “More columns” for contact, birthday, kit, club, advocate & promo.'}
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
                onClick={() =>
                  exportToExcel(pagination, filters, sortBy, sortDir, ageRangeMin, ageRangeMax)
                }
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-fira-sans text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
            )}
            {registrantsExportAllEmailsEnabled && (
              <button
                type="button"
                onClick={() => void handleOpenAllEmailsModal()}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors font-fira-sans text-sm font-medium flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Uses the same filters as the table (excluding pagination). Unique emails, comma-separated."
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                All emails
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
                    {showExtraTableColumns && (
                      <SortableTh field="contact" label="Contact" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    )}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                          Signup IP
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                          Signup Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                          Signup Device
                        </th>
                      </>
                    )}
                    <SortableTh field="mailerStatus" label="Email Status" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    <SortableTh field="createdAt" label="Registered" sortBy={sortBy} sortDir={sortDir} onSort={handleSortColumn} />
                    {(registrantSendEmailEnabled || deleteUserEnabled) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const raceExperience = formatRaceCategoryLabel(
                      user.raceCategory,
                      user.patronSpeedDistance
                    );
                    const ageYears = getAgeYearsFromBirthday(user.birthday);
                    const ageLabel =
                      ageYears != null ? formatCompletedAgeLabel(ageYears) : null;
                    const nameTitle = ageLabel ? `${user.name} ${ageLabel}` : user.name;
                    return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 text-sm font-medium text-gray-900 font-sweet-sans whitespace-nowrap"
                        title={nameTitle}
                      >
                        <span className="text-gray-900">{user.name}</span>
                        {ageLabel != null && (
                          <span className="text-gray-500 font-normal"> {ageLabel}</span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-gray-500 font-sweet-sans ${
                          showExtraTableColumns ? 'whitespace-nowrap' : 'max-w-[9rem] sm:max-w-[12rem] truncate whitespace-nowrap'
                        }`}
                        title={user.email}
                      >
                        {user.email}
                      </td>
                      {showExtraTableColumns && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                          {user.contact}
                        </td>
                      )}
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
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans max-w-[10rem] truncate"
                            title={user.signupContext?.ip || undefined}
                          >
                            {user.signupContext?.ip || '—'}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-500 font-sweet-sans max-w-[12rem] truncate"
                            title={user.signupContext?.locationLabel || undefined}
                          >
                            {user.signupContext?.locationLabel || '—'}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans"
                            title={user.signupContext?.userAgent || undefined}
                          >
                            {user.signupContext?.deviceType || '—'}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void openMailerPreview(user)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors ${mailerStatusButtonClass(
                              user.mailerStatus
                            )}`}
                            title="View registration email preview"
                          >
                            {user.mailerStatus || 'pending'}
                          </button>
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
                      {(registrantSendEmailEnabled || deleteUserEnabled) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {registrantSendEmailEnabled && (
                            <button
                              type="button"
                              onClick={() => openComposeEmail(user)}
                              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors font-fira-sans"
                            >
                              Send email
                            </button>
                          )}
                          {deleteUserEnabled && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="text-red-600 hover:text-red-900 transition-colors font-fira-sans"
                              title="Delete user"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
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

      {allEmailsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={closeAllEmailsModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-emails-modal-title"
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 id="all-emails-modal-title" className="text-lg font-semibold text-gray-900 font-druk">
                  Registrant emails
                </h3>
                <p className="text-sm text-gray-600 font-sweet-sans mt-1">
                  {allEmailsLoading
                    ? 'Loading…'
                    : allEmailsError
                      ? allEmailsError
                      : `${allEmailsCount} unique address${allEmailsCount === 1 ? '' : 'es'} (current table filters, sorted A–Z).`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAllEmailsModal}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm font-fira-sans text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto min-h-0 flex-1 space-y-3">
              {allEmailsLoading && (
                <p className="text-sm text-gray-500 font-sweet-sans">Fetching email list…</p>
              )}
              {!allEmailsLoading && allEmailsError && (
                <p className="text-sm text-red-600 font-sweet-sans">{allEmailsError}</p>
              )}
              {!allEmailsLoading && !allEmailsError && (
                <textarea
                  readOnly
                  value={allEmailsText}
                  rows={12}
                  className="w-full min-h-[200px] px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-y"
                  aria-label="Comma-separated registrant emails"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={closeAllEmailsModal}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-fira-sans text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => void handleCopyAllEmails()}
                disabled={allEmailsLoading || !!allEmailsError || !allEmailsText}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-fira-sans font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allEmailsCopied ? 'Copied' : 'Copy to clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {composeEmailOpen && composeEmailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={closeComposeEmail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-email-title"
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 id="compose-email-title" className="text-lg font-semibold text-gray-900 font-druk">
                  Send email
                </h3>
                <p className="text-sm text-gray-600 font-sweet-sans mt-1">
                  {composeEmailUser.name} · {composeEmailUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeComposeEmail}
                disabled={composeEmailSending}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm font-fira-sans text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto min-h-0 space-y-4">
              <div>
                <label htmlFor="compose-email-subject" className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">
                  Subject
                </label>
                <input
                  id="compose-email-subject"
                  type="text"
                  value={composeEmailSubject}
                  onChange={(e) => setComposeEmailSubject(e.target.value)}
                  disabled={composeEmailSending}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm font-sweet-sans text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                  placeholder="Email subject"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 font-fira-sans">Message</p>
                  <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={composeEmailHtml}
                      onChange={setComposeEmailHtml}
                      modules={composeEmailQuillModules}
                      formats={composeEmailQuillFormats}
                      readOnly={composeEmailSending}
                      className="compose-email-quill"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 font-fira-sans">Preview</p>
                  <div className="min-h-[280px] max-h-[420px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div
                      className="prose prose-sm max-w-none font-sweet-sans"
                      dangerouslySetInnerHTML={{ __html: composeEmailHtml }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={closeComposeEmail}
                disabled={composeEmailSending}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-fira-sans text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSendComposedEmail()}
                disabled={composeEmailSending}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-fira-sans font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {composeEmailSending ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mailerPreviewOpen && mailerPreviewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={closeMailerPreview}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mailer-preview-title"
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[88vh] flex flex-col border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 id="mailer-preview-title" className="text-lg font-semibold text-gray-900 font-druk">
                  Registration email preview
                </h3>
                <p className="text-sm text-gray-600 font-sweet-sans mt-1">
                  {mailerPreviewUser.name} · {mailerPreviewUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMailerPreview}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm font-fira-sans text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto min-h-0">
              {mailerPreviewLoading && (
                <p className="text-sm text-gray-500 font-sweet-sans">Loading email preview…</p>
              )}
              {!mailerPreviewLoading && mailerPreviewError && (
                <p className="text-sm text-red-600 font-sweet-sans">{mailerPreviewError}</p>
              )}
              {!mailerPreviewLoading && !mailerPreviewError && mailerPreview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-sweet-sans">
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">Status:</span>{' '}
                      {mailerPreview.mailerStatus}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">Subject:</span>{' '}
                      {mailerPreview.subject || '—'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">Last attempt:</span>{' '}
                      {mailerPreview.mailerLastAttemptAt
                        ? new Date(mailerPreview.mailerLastAttemptAt).toLocaleString()
                        : '—'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">Preview captured:</span>{' '}
                      {mailerPreview.capturedAt
                        ? new Date(mailerPreview.capturedAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  {mailerPreview.mailerStatus === 'failed' && mailerPreview.mailerLastError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-sweet-sans">
                      {mailerPreview.mailerLastError}
                    </div>
                  )}
                  {mailerPreview.html ? (
                    <iframe
                      title={`Registration email preview for ${mailerPreviewUser.name}`}
                      srcDoc={mailerPreview.html}
                      className="w-full h-[60vh] border border-gray-200 rounded-lg bg-white"
                      sandbox=""
                    />
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 font-sweet-sans whitespace-pre-wrap">
                      {mailerPreview.text || 'No email preview was saved for this registration yet.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

