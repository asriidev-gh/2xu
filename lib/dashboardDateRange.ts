export type DateRangeValue = [Date, Date] | null;

/** Default dashboard range: May 23 (UTC) through today (UTC). */
export function defaultDashboardDateRange(): DateRangeValue {
  const now = new Date();
  const year = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, 4, 23, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  return [start, end];
}

export function formatYmdUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultDashboardDateFilterStrings(): { dateFrom: string; dateTo: string } {
  const range = defaultDashboardDateRange();
  if (!range) return { dateFrom: '', dateTo: '' };
  return { dateFrom: formatYmdUtc(range[0]), dateTo: formatYmdUtc(range[1]) };
}

export function dateRangeFromFilterStrings(dateFrom: string, dateTo: string): DateRangeValue {
  if (!dateFrom || !dateTo) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return null;
  }
  const start = new Date(`${dateFrom}T00:00:00.000Z`);
  const end = new Date(`${dateTo}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return [start, end];
}

export function filterStringsFromDateRange(range: DateRangeValue): {
  dateFrom: string;
  dateTo: string;
} {
  if (!range) return { dateFrom: '', dateTo: '' };
  return { dateFrom: formatYmdUtc(range[0]), dateTo: formatYmdUtc(range[1]) };
}

export function isDefaultDashboardDateFilter(dateFrom: string, dateTo: string): boolean {
  const defaults = defaultDashboardDateFilterStrings();
  return dateFrom === defaults.dateFrom && dateTo === defaults.dateTo;
}

export function appendInsightsDateRangeParams(
  q: URLSearchParams,
  dateRange: DateRangeValue
): void {
  if (!dateRange) return;
  const { dateFrom, dateTo } = filterStringsFromDateRange(dateRange);
  q.set('startDate', dateFrom);
  q.set('endDate', dateTo);
}
