'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { DateRangePicker } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import DashboardAdminHeader from '@/components/DashboardAdminHeader';
import { getAgeYearsFromBirthday } from '@/lib/completedAge';
import {
  appendInsightsDateRangeParams,
  defaultDashboardDateRange,
  type DateRangeValue,
} from '@/lib/dashboardDateRange';
import { formatRegistrantProfileName, genderLetterAbbrev } from '@/lib/registrantProfileName';

type InsightsPayload = {
  generatedAt: string;
  registrationsToday: number;
  registrationsThisWeek: number;
  registrationsThisMonth: number;
  totalRegistered: number;
  soloRows: number;
  distinctGroupRegistrations: number;
  withPromoCode: number;
  withoutPromoCode: number;
  promotionalOptIn: number;
  byRaceCategory: { name: string; count: number }[];
  byGender: { name: string; count: number }[];
  registrationsByDay: { date: string; count: number; label: string }[];
  topClubs: { name: string; count: number }[];
  byDeviceType: { name: string; count: number }[];
  byLocation: { name: string; count: number; filterKeys?: string[] }[];
  byAgeBracket: { name: string; count: number; ageMin?: number; ageMax?: number }[];
};

type DetailMetric =
  | 'all'
  | 'solo'
  | 'team_member'
  | 'group_leads'
  | 'with_promo'
  | 'without_promo'
  | 'promotional'
  | 'race'
  | 'gender'
  | 'day'
  | 'club'
  | 'period_today'
  | 'period_week'
  | 'period_month'
  | 'signup_device'
  | 'signup_location'
  | 'age_bracket';

const UNRECORDED_SIGNUP_LABEL = 'Unrecorded';

type DetailUser = {
  _id: string;
  name: string;
  email: string;
  contact: string;
  gender: string;
  birthday: string;
  raceCategory: string;
  speedDistance?: string;
  tShirtSize: string;
  affiliations: string;
  promotional: boolean;
  promoCode: string;
  teamMemberIndex?: number;
  signupContext?: {
    ip: string;
    locationLabel: string;
    deviceType: string;
    userAgent: string;
  };
  createdAt: string | null;
};

function formatRaceCategoryLabel(raceCategory: string, speedDistance?: string) {
  const base = raceCategory?.trim() || '';
  const speed = speedDistance?.trim();
  return speed ? `${base} (${speed})` : base;
}

type DetailSortField =
  | 'name'
  | 'email'
  | 'contact'
  | 'gender'
  | 'raceCategory'
  | 'affiliations'
  | 'promoCode'
  | 'promotional'
  | 'teamMemberIndex'
  | 'createdAt';

function DetailSortableTh({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
}: {
  field: DetailSortField;
  label: string;
  sortBy: DetailSortField;
  sortDir: 'asc' | 'desc';
  onSort: (field: DetailSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <th
      scope="col"
      className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wide font-fira-sans align-bottom whitespace-nowrap"
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 -mx-0.5 px-0.5 py-0.5 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
          active ? 'text-orange-600' : 'text-gray-500 hover:text-gray-800'
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
        <span className="inline-flex w-3 justify-center text-[10px] leading-none" aria-hidden>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : null}
        </span>
      </button>
    </th>
  );
}

function formatDateForExport(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

async function fetchAllInsightDetailUsers(
  onUnauthorized: () => void,
  metric: DetailMetric,
  value: string,
  total: number,
  sortBy: DetailSortField,
  sortDir: 'asc' | 'desc',
  nameSearch = '',
  dateRange: DateRangeValue = null
): Promise<DetailUser[]> {
  const limit = 100;
  const pages = Math.max(1, Math.ceil(total / limit));
  const out: DetailUser[] = [];
  const ns = nameSearch.trim().slice(0, 120);
  for (let page = 1; page <= pages; page += 1) {
    const q = new URLSearchParams({
      metric,
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
    });
    if (value) q.set('value', value);
    if (ns) q.set('nameSearch', ns);
    appendInsightsDateRangeParams(q, dateRange);
    const res = await fetch(`/api/users/insights/details?${q}`);
    if (res.status === 401) {
      onUnauthorized();
      return [];
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || 'Failed to load rows for export');
    }
    const batch = (json.users || []) as DetailUser[];
    out.push(...batch);
  }
  return out;
}

function ClickableStat({
  count,
  label,
  onClick,
  className = '',
}: {
  count: number;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const disabled = count <= 0;
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? undefined : `View list: ${label}`}
      onClick={onClick}
      className={`inline-flex items-baseline justify-center rounded-md px-1.5 py-0.5 -mx-0.5 text-left align-baseline transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 cursor-pointer hover:bg-orange-50 hover:shadow-sm hover:ring-1 hover:ring-orange-200/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:ring-0 disabled:active:scale-100 ${className}`}
    >
      {count}
    </button>
  );
}

function BarRow({
  label,
  count,
  max,
  onCountClick,
}: {
  label: string;
  count: number;
  max: number;
  onCountClick?: () => void;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const canOpen = Boolean(onCountClick) && count > 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm font-sweet-sans text-gray-700 mb-1 gap-2">
        <span className="truncate" title={label}>
          {label}
        </span>
        {canOpen ? (
          <button
            type="button"
            onClick={onCountClick}
            title="View registrants"
            className="shrink-0 font-semibold text-orange-600 rounded-md px-2 py-0.5 -my-0.5 transition-all duration-150 ease-out underline decoration-dotted underline-offset-2 hover:bg-orange-50 hover:text-orange-700 hover:shadow-sm hover:ring-1 hover:ring-orange-200/70 hover:decoration-solid active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
          >
            {count}
          </button>
        ) : (
          <span className="shrink-0 font-semibold text-gray-900">{count}</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailBlastEnabled, setEmailBlastEnabled] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailMetric, setDetailMetric] = useState<DetailMetric>('all');
  const [detailValue, setDetailValue] = useState('');
  const [detailPage, setDetailPage] = useState(1);
  const [detailUsers, setDetailUsers] = useState<DetailUser[]>([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [detailTotalPages, setDetailTotalPages] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [detailSortBy, setDetailSortBy] = useState<DetailSortField>('createdAt');
  const [detailSortDir, setDetailSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailNameQuery, setDetailNameQuery] = useState('');
  const [detailNameApplied, setDetailNameApplied] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => defaultDashboardDateRange());

  const loadDetailsPage = useCallback(
    async (
      page: number,
      metric: DetailMetric,
      value: string,
      sortBy: DetailSortField,
      sortDir: 'asc' | 'desc',
      nameSearchOverride?: string
    ) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const q = new URLSearchParams({
          metric,
          page: String(page),
          limit: '25',
          sortBy,
          sortDir,
        });
        if (value) q.set('value', value);
        const nameQ = (nameSearchOverride !== undefined ? nameSearchOverride : detailNameApplied)
          .trim()
          .slice(0, 120);
        if (nameQ) q.set('nameSearch', nameQ);
        appendInsightsDateRangeParams(q, dateRange);
        const res = await fetch(`/api/users/insights/details?${q}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load list');
        }
        setDetailUsers((json.users || []) as DetailUser[]);
        setDetailTotal(typeof json.total === 'number' ? json.total : 0);
        setDetailTotalPages(typeof json.totalPages === 'number' ? json.totalPages : 1);
        setDetailPage(typeof json.page === 'number' ? json.page : page);
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : 'Could not load list');
        setDetailUsers([]);
        setDetailTotal(0);
        setDetailTotalPages(1);
      } finally {
        setDetailLoading(false);
      }
    },
    [router, detailNameApplied, dateRange]
  );

  const openDetails = useCallback(
    (title: string, metric: DetailMetric, value = '') => {
      setDetailTitle(title);
      setDetailMetric(metric);
      setDetailValue(value);
      setDetailUsers([]);
      setDetailTotal(0);
      setDetailTotalPages(1);
      setDetailError(null);
      setDetailSortBy('createdAt');
      setDetailSortDir('desc');
      setDetailNameQuery('');
      setDetailNameApplied('');
      setDetailOpen(true);
      void loadDetailsPage(1, metric, value, 'createdAt', 'desc', '');
    },
    [loadDetailsPage]
  );

  const applyDetailNameSearch = useCallback(() => {
    const q = detailNameQuery.trim();
    setDetailNameApplied(q);
    void loadDetailsPage(1, detailMetric, detailValue, detailSortBy, detailSortDir, q);
  }, [
    detailNameQuery,
    detailMetric,
    detailValue,
    detailSortBy,
    detailSortDir,
    loadDetailsPage,
  ]);

  const clearDetailNameSearch = useCallback(() => {
    setDetailNameQuery('');
    setDetailNameApplied('');
    void loadDetailsPage(1, detailMetric, detailValue, detailSortBy, detailSortDir, '');
  }, [detailMetric, detailValue, detailSortBy, detailSortDir, loadDetailsPage]);

  const handleDetailSortColumn = (field: DetailSortField) => {
    let nextBy: DetailSortField = field;
    let nextDir: 'asc' | 'desc';
    if (detailSortBy === field) {
      nextBy = field;
      nextDir = detailSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      nextBy = field;
      nextDir = field === 'createdAt' ? 'desc' : 'asc';
    }
    setDetailSortBy(nextBy);
    setDetailSortDir(nextDir);
    void loadDetailsPage(1, detailMetric, detailValue, nextBy, nextDir);
  };

  const closeDetails = useCallback(() => {
    setDetailOpen(false);
    setDetailError(null);
  }, []);

  const handleExportInsightsExcel = useCallback(async () => {
    if (detailTotal <= 0) {
      await Swal.fire({
        title: 'No data',
        text: 'There are no rows to export for this view.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }
    setExportingExcel(true);
    try {
      const allUsers = await fetchAllInsightDetailUsers(
        () => router.push('/login'),
        detailMetric,
        detailValue,
        detailTotal,
        detailSortBy,
        detailSortDir,
        detailNameApplied,
        dateRange
      );
      if (allUsers.length === 0) {
        await Swal.fire({
          title: 'No data',
          text: 'Could not load rows for export.',
          icon: 'warning',
          confirmButtonColor: '#ea580c',
        });
        return;
      }

      const headers = [
        'Name',
        'Email',
        'Contact',
        'Promo Code',
        'Birthday',
        'Race Experience',
        'T-shirt Size',
        'Club/Organization',
        'Team member index',
        'Signup IP',
        'Signup location',
        'Signup device',
        'Registration Date',
      ];

      const rows = allUsers.map((u) => [
        formatRegistrantProfileName(u),
        u.email,
        u.contact,
        u.promoCode || '',
        u.birthday || '',
        formatRaceCategoryLabel(u.raceCategory, u.speedDistance),
        u.tShirtSize || '',
        u.affiliations || '',
        u.teamMemberIndex != null ? String(u.teamMemberIndex) : '',
        u.signupContext?.ip || '',
        u.signupContext?.locationLabel || '',
        u.signupContext?.deviceType || '',
        formatDateForExport(u.createdAt),
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrants');

      const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([xlsxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `insights-${detailMetric}-${dateStr}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await Swal.fire({
        title: 'Exported',
        text: `Saved ${allUsers.length} row(s) to Excel.`,
        icon: 'success',
        confirmButtonColor: '#ea580c',
        timer: 2200,
      });
    } catch (e) {
      await Swal.fire({
        title: 'Export failed',
        text: e instanceof Error ? e.message : 'Please try again.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setExportingExcel(false);
    }
  }, [
    detailTotal,
    detailMetric,
    detailValue,
    detailSortBy,
    detailSortDir,
    detailNameApplied,
    dateRange,
    router,
  ]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const insightsQuery = new URLSearchParams();
        appendInsightsDateRangeParams(insightsQuery, dateRange);
        const insightsUrl = insightsQuery.toString()
          ? `/api/users/insights?${insightsQuery.toString()}`
          : '/api/users/insights';
        const [insightsRes, configRes] = await Promise.all([
          fetch(insightsUrl),
          fetch('/api/users/config'),
        ]);
        if (insightsRes.status === 401) {
          router.push('/login');
          return;
        }
        if (configRes.ok) {
          const cfg = await configRes.json();
          setEmailBlastEnabled(cfg.emailBlastEnabled === true);
        }
        if (!insightsRes.ok) {
          const err = await insightsRes.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load insights');
        }
        const json = await insightsRes.json();
        setData(json as InsightsPayload);
      } catch (e) {
        console.error(e);
        await Swal.fire({
          title: 'Error',
          text: e instanceof Error ? e.message : 'Could not load insights.',
          icon: 'error',
          confirmButtonColor: '#ea580c',
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, dateRange]);

  const maxRace = data ? Math.max(1, ...data.byRaceCategory.map((r) => r.count)) : 1;
  const raceExperienceTotal = data
    ? data.byRaceCategory.reduce((sum, r) => sum + r.count, 0)
    : 0;
  const maxGender = data ? Math.max(1, ...data.byGender.map((r) => r.count)) : 1;
  const maxClub = data ? Math.max(1, ...data.topClubs.map((r) => r.count)) : 1;
  const maxDevice = data ? Math.max(1, ...(data.byDeviceType || []).map((r) => r.count)) : 1;
  const maxLocation = data ? Math.max(1, ...(data.byLocation || []).map((r) => r.count)) : 1;
  const maxAgeBracket = data ? Math.max(1, ...(data.byAgeBracket || []).map((r) => r.count)) : 1;
  const maxDaily = data ? Math.max(1, ...data.registrationsByDay.map((d) => d.count)) : 1;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100/90 text-gray-900">
      <DashboardAdminHeader emailBlastEnabled={emailBlastEnabled} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-12">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-druk">Registration insights</h2>
              <p className="text-sm text-gray-600 font-sweet-sans mt-1">
                Snapshot across all stored registrations.
              </p>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-medium text-gray-500 font-fira-sans mb-1">
                Insights date range (UTC)
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={(next: DateRangeValue) => {
                  setDateRange(next);
                }}
                cleanable
                editable={false}
                format="yyyy-MM-dd"
                character=" to "
                placeholder="All time"
                placement="bottomEnd"
                className="w-full md:min-w-[320px]"
              />
            </div>
          </div>
          {data?.generatedAt && (
            <p className="text-xs text-gray-400 font-sweet-sans mt-1">
              Generated {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500 font-sweet-sans">
            Loading insights…
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 border-l-4 border-l-orange-500">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">Today</p>
                <p className="text-3xl font-bold text-orange-600 font-druk mt-1">
                  <ClickableStat
                    count={data.registrationsToday ?? 0}
                    label="Registrations · today (UTC)"
                    onClick={() => openDetails('Registrations · today (UTC)', 'period_today')}
                    className="font-druk font-bold text-3xl text-orange-600"
                  />
                </p>
                <p className="text-xs text-gray-500 font-sweet-sans mt-2">UTC calendar day (00:00–23:59)</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 border-l-4 border-l-orange-400">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">This week</p>
                <p className="text-3xl font-bold text-orange-600 font-druk mt-1">
                  <ClickableStat
                    count={data.registrationsThisWeek ?? 0}
                    label="Registrations · this week so far (UTC)"
                    onClick={() => openDetails('Registrations · this week so far (UTC)', 'period_week')}
                    className="font-druk font-bold text-3xl text-orange-600"
                  />
                </p>
                <p className="text-xs text-gray-500 font-sweet-sans mt-2">
                  Monday 00:00 UTC through now (ISO week)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">Total rows</p>
                <p className="text-3xl font-bold text-orange-600 font-druk mt-1">
                  <ClickableStat
                    count={data.totalRegistered}
                    label="All registration rows"
                    onClick={() => openDetails('All registration rows', 'all')}
                    className="font-druk font-bold text-3xl text-orange-600"
                  />
                </p>
                <div className="mt-2 space-y-1 text-xs text-gray-500 font-sweet-sans">
                  <p>
                    Solo registrations:{' '}
                    <ClickableStat
                      count={data.soloRows}
                      label="Solo registrations"
                      onClick={() => openDetails('Solo registrations', 'solo')}
                      className="inline font-semibold text-gray-900 underline decoration-dotted"
                    />
                  </p>
                  <p>
                    Team/duo member rows:{' '}
                    <ClickableStat
                      count={Math.max(0, data.totalRegistered - data.soloRows)}
                      label="Team / duo member rows"
                      onClick={() => openDetails('Team / duo member rows', 'team_member')}
                      className="inline font-semibold text-gray-900 underline decoration-dotted"
                    />
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">Group registrations</p>
                <p className="text-3xl font-bold text-gray-900 font-druk mt-1">
                  <ClickableStat
                    count={data.distinctGroupRegistrations}
                    label="Distinct group registrations (one row per team)"
                    onClick={() =>
                      openDetails('Distinct group registrations (team lead per group)', 'group_leads')
                    }
                    className="font-druk font-bold text-3xl text-gray-900"
                  />
                </p>
                <p className="text-xs text-gray-500 font-sweet-sans mt-2">Distinct team / duo IDs</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">With advocate / promo code</p>
                <p className="text-3xl font-bold text-gray-900 font-druk mt-1">
                  <ClickableStat
                    count={data.withPromoCode}
                    label="Rows with advocate / promo code"
                    onClick={() => openDetails('With advocate / promo code', 'with_promo')}
                    className="font-druk font-bold text-3xl text-gray-900"
                  />
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">Without advocate / promo code</p>
                <p className="text-3xl font-bold text-gray-900 font-druk mt-1">
                  <ClickableStat
                    count={data.withoutPromoCode ?? 0}
                    label="Rows without advocate / promo code"
                    onClick={() => openDetails('Without advocate / promo code', 'without_promo')}
                    className="font-druk font-bold text-3xl text-gray-900"
                  />
                </p>
                <p className="text-xs text-gray-500 font-sweet-sans mt-2">
                  Blank, missing, or whitespace-only code (same rule as “with code” inverted).
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 font-fira-sans">Promotional opt-in</p>
                <p className="text-3xl font-bold text-gray-900 font-druk mt-1">
                  <ClickableStat
                    count={data.promotionalOptIn}
                    label="Promotional opt-in"
                    onClick={() => openDetails('Promotional opt-in', 'promotional')}
                    className="font-druk font-bold text-3xl text-gray-900"
                  />
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-4">
                  Race experience{' '}
                  <span className="text-base font-normal text-gray-500 font-fira-sans tracking-normal">
                    ({raceExperienceTotal} total{' '}
                    {raceExperienceTotal === 1 ? 'registrant' : 'registrants'})
                  </span>
                </h3>
                <div className="max-h-80 overflow-y-auto pr-1">
                  {data.byRaceCategory.length === 0 ? (
                    <p className="text-sm text-gray-500 font-sweet-sans">No data</p>
                  ) : (
                    data.byRaceCategory.map((r) => (
                      <BarRow
                        key={r.name}
                        label={r.name}
                        count={r.count}
                        max={maxRace}
                        onCountClick={() => openDetails(`Race: ${r.name}`, 'race', r.name)}
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-4">Gender</h3>
                {data.byGender.map((r) => (
                  <BarRow
                    key={r.name}
                    label={r.name}
                    count={r.count}
                    max={maxGender}
                    onCountClick={() =>
                      openDetails(
                        `Gender: ${r.name}`,
                        'gender',
                        r.name === 'Other / not set' ? '__OTHER__' : r.name
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-1">
                  Registrants age group
                </h3>
                <div className="max-h-80 overflow-y-auto pr-1">
                  {(data.byAgeBracket || []).length === 0 ? (
                    <p className="text-sm text-gray-500 font-sweet-sans">No age data yet</p>
                  ) : (
                    (data.byAgeBracket || []).map((r) => (
                      <BarRow
                        key={r.name}
                        label={r.name}
                        count={r.count}
                        max={maxAgeBracket}
                        onCountClick={
                          r.name === UNRECORDED_SIGNUP_LABEL ||
                          r.ageMin === undefined ||
                          r.ageMax === undefined
                            ? undefined
                            : () =>
                                openDetails(
                                  `Age: ${r.name}`,
                                  'age_bracket',
                                  JSON.stringify({ min: r.ageMin, max: r.ageMax })
                                )
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-4">
                  New registrations (last 14 days)
                </h3>
                <div className="flex items-end justify-between gap-1 h-44 px-1 border-b border-gray-100 pb-1">
                  {data.registrationsByDay.map((d) => {
                    const maxPx = 120;
                    const barPx =
                      maxDaily > 0 ? Math.max(4, Math.round((d.count / maxDaily) * maxPx)) : 4;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full">
                        {d.count > 0 ? (
                          <button
                            type="button"
                            title="View registrants for this day"
                            onClick={() =>
                              openDetails(`Registrations · ${d.label} (${d.date})`, 'day', d.date)
                            }
                            className="min-w-[1.25rem] rounded px-1 py-0.5 text-[10px] text-orange-600 font-sweet-sans leading-tight text-center font-semibold transition-all duration-150 ease-out underline decoration-dotted underline-offset-2 hover:bg-orange-50 hover:text-orange-700 hover:shadow-sm hover:ring-1 hover:ring-orange-200/70 hover:decoration-solid active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                          >
                            {d.count}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-sweet-sans leading-tight text-center">
                            {d.count}
                          </span>
                        )}
                        <div
                          className="w-full max-w-[18px] mx-auto rounded-t bg-orange-500"
                          style={{ height: `${barPx}px` }}
                          title={`${d.date}: ${d.count}`}
                        />
                        <span className="text-[9px] text-gray-400 font-sweet-sans truncate w-full text-center">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-4">Top clubs / organizations</h3>
                <div className="max-h-80 overflow-y-auto pr-1">
                  {data.topClubs.length === 0 ? (
                    <p className="text-sm text-gray-500 font-sweet-sans">No affiliation data yet</p>
                  ) : (
                    data.topClubs.map((r) => (
                      <BarRow
                        key={r.name}
                        label={r.name}
                        count={r.count}
                        max={maxClub}
                        onCountClick={() => openDetails(`Club: ${r.name}`, 'club', r.name)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-4">Signup devices</h3>
                <div className="max-h-80 overflow-y-auto pr-1">
                  {(data.byDeviceType || []).length === 0 ? (
                    <p className="text-sm text-gray-500 font-sweet-sans">No signup device data yet</p>
                  ) : (
                    (data.byDeviceType || []).map((r) => (
                      <BarRow
                        key={r.name}
                        label={r.name}
                        count={r.count}
                        max={maxDevice}
                        onCountClick={
                          r.name === UNRECORDED_SIGNUP_LABEL
                            ? undefined
                            : () => openDetails(`Signup device: ${r.name}`, 'signup_device', r.name)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 font-druk mb-4">Top signup locations</h3>
                <div className="max-h-80 overflow-y-auto pr-1">
                  {(data.byLocation || []).length === 0 ? (
                    <p className="text-sm text-gray-500 font-sweet-sans">No signup location data yet</p>
                  ) : (
                    (data.byLocation || []).map((r) => (
                      <BarRow
                        key={r.name}
                        label={r.name}
                        count={r.count}
                        max={maxLocation}
                        onCountClick={
                          r.name === UNRECORDED_SIGNUP_LABEL || !r.filterKeys?.length
                            ? undefined
                            : () =>
                                openDetails(
                                  `Signup location: ${r.name}`,
                                  'signup_location',
                                  JSON.stringify(r.filterKeys)
                                )
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {detailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="insights-detail-title"
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[88vh] flex flex-col border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 id="insights-detail-title" className="text-lg font-semibold text-gray-900 font-druk">
                  {detailTitle}
                </h2>
                <p className="text-xs text-gray-500 font-sweet-sans mt-1">
                  {detailLoading ? 'Loading…' : `${detailTotal} row${detailTotal === 1 ? '' : 's'} total`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                <button
                  type="button"
                  disabled={detailTotal <= 0 || exportingExcel || detailLoading || Boolean(detailError)}
                  onClick={() => void handleExportInsightsExcel()}
                  className="px-3 py-1.5 rounded-md text-sm font-fira-sans bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exportingExcel ? 'Exporting…' : 'Export to Excel'}
                </button>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="px-3 py-1.5 rounded-md text-sm font-fira-sans border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
              <label
                htmlFor="insights-detail-name-search"
                className="block text-xs font-medium text-gray-600 mb-1.5 font-fira-sans"
              >
                Filter by name
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  id="insights-detail-name-search"
                  type="search"
                  value={detailNameQuery}
                  onChange={(e) => setDetailNameQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void applyDetailNameSearch();
                    }
                  }}
                  placeholder="Input name here"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-sweet-sans text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                  maxLength={120}
                  autoComplete="off"
                  disabled={detailLoading}
                />
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void applyDetailNameSearch()}
                    disabled={detailLoading}
                    className="px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-fira-sans font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => void clearDetailNameSearch()}
                    disabled={
                      detailLoading ||
                      (detailNameQuery.trim() === '' && detailNameApplied.trim() === '')
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-fira-sans text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {detailNameApplied.trim() !== '' && (
                <p className="text-xs text-gray-500 font-sweet-sans mt-2">
                  Active:{' '}
                  <span className="font-medium text-gray-800">&quot;{detailNameApplied}&quot;</span>
                </p>
              )}
            </div>

            {detailError && (
              <div className="px-5 py-3 text-sm text-red-600 font-sweet-sans border-b border-red-50 bg-red-50">
                {detailError}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto px-5 py-3">
              {detailLoading && detailUsers.length === 0 ? (
                <p className="text-sm text-gray-500 font-sweet-sans py-8 text-center">Loading list…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm font-sweet-sans">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-fira-sans text-xs uppercase tracking-wide">
                        <DetailSortableTh
                          field="name"
                          label="Name"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="email"
                          label="Email"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="contact"
                          label="Contact"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="promoCode"
                          label="Promo Code"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="raceCategory"
                          label="Race"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="affiliations"
                          label="Club"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="teamMemberIndex"
                          label="Team #"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wide font-fira-sans text-gray-500 whitespace-nowrap">
                          IP
                        </th>
                        <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wide font-fira-sans text-gray-500 whitespace-nowrap">
                          Location
                        </th>
                        <th className="py-2 pr-3 text-left text-xs font-medium uppercase tracking-wide font-fira-sans text-gray-500 whitespace-nowrap">
                          Device
                        </th>
                        <DetailSortableTh
                          field="gender"
                          label="Gender"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                        <DetailSortableTh
                          field="createdAt"
                          label="Registered"
                          sortBy={detailSortBy}
                          sortDir={detailSortDir}
                          onSort={handleDetailSortColumn}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {detailUsers.map((u) => {
                        const raceExperience = formatRaceCategoryLabel(
                          u.raceCategory,
                          u.speedDistance
                        );
                        const abbr = genderLetterAbbrev(u.gender);
                        const ageYears = getAgeYearsFromBirthday(u.birthday || '');
                        const nameTitle = formatRegistrantProfileName(u);
                        let nameInner;
                        if (abbr && ageYears != null) {
                          nameInner = (
                            <>
                              <span className="text-gray-900">{u.name}</span>
                              <span className="text-gray-500 font-normal">{` (${abbr}-${ageYears} yrs old)`}</span>
                            </>
                          );
                        } else if (abbr) {
                          nameInner = (
                            <>
                              <span className="text-gray-900">{u.name}</span>
                              <span className="text-gray-500 font-normal">{` (${abbr})`}</span>
                            </>
                          );
                        } else if (ageYears != null) {
                          nameInner = (
                            <>
                              <span className="text-gray-900">{u.name}</span>
                              <span className="text-gray-500 font-normal">{` (${ageYears} yrs old)`}</span>
                            </>
                          );
                        } else {
                          nameInner = <span className="text-gray-900">{u.name}</span>;
                        }
                        return (
                        <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td
                            className="py-2 pr-3 text-gray-900 font-medium whitespace-nowrap max-w-[min(22rem,55vw)]"
                            title={nameTitle}
                          >
                            {nameInner}
                          </td>
                          <td className="py-2 pr-3 text-gray-700 max-w-[180px] truncate" title={u.email}>
                            {u.email}
                          </td>
                          <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{u.contact}</td>
                          <td className="py-2 pr-3 text-gray-700 whitespace-nowrap max-w-[120px] truncate" title={u.promoCode || undefined}>
                            {u.promoCode || '—'}
                          </td>
                          <td className="py-2 pr-3 text-gray-700 max-w-[120px] truncate" title={raceExperience}>
                            {raceExperience}
                          </td>
                          <td className="py-2 pr-3 text-gray-700 max-w-[140px] truncate" title={u.affiliations}>
                            {u.affiliations}
                          </td>
                          <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">
                            {u.teamMemberIndex != null ? u.teamMemberIndex : '—'}
                          </td>
                          <td
                            className="py-2 pr-3 text-gray-700 whitespace-nowrap max-w-[120px] truncate"
                            title={u.signupContext?.ip || undefined}
                          >
                            {u.signupContext?.ip || '—'}
                          </td>
                          <td
                            className="py-2 pr-3 text-gray-700 max-w-[160px] truncate"
                            title={u.signupContext?.locationLabel || undefined}
                          >
                            {u.signupContext?.locationLabel || '—'}
                          </td>
                          <td
                            className="py-2 pr-3 text-gray-700 whitespace-nowrap"
                            title={u.signupContext?.userAgent || undefined}
                          >
                            {u.signupContext?.deviceType || '—'}
                          </td>
                          <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{u.gender}</td>
                          <td className="py-2 pr-3 text-gray-600 whitespace-nowrap text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!detailLoading && detailUsers.length === 0 && !detailError && (
                    <p className="text-sm text-gray-500 py-6 text-center">No rows in this slice.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
              <p className="text-xs text-gray-500 font-sweet-sans">
                Page {detailPage} of {detailTotalPages}
                {detailLoading ? ' · updating…' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={detailPage <= 1 || detailLoading}
                  onClick={() =>
                    void loadDetailsPage(
                      detailPage - 1,
                      detailMetric,
                      detailValue,
                      detailSortBy,
                      detailSortDir
                    )
                  }
                  className="px-3 py-1.5 rounded-md text-sm font-fira-sans border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={detailPage >= detailTotalPages || detailLoading}
                  onClick={() =>
                    void loadDetailsPage(
                      detailPage + 1,
                      detailMetric,
                      detailValue,
                      detailSortBy,
                      detailSortDir
                    )
                  }
                  className="px-3 py-1.5 rounded-md text-sm font-fira-sans border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
