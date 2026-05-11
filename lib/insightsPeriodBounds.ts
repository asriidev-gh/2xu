/**
 * Registration period windows for insights (server uses these bounds with Mongo `createdAt`).
 * All boundaries are **UTC** so counts match regardless of Node server timezone.
 */

export function getUtcTodayBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

/** Monday 00:00:00.000 UTC of the ISO week containing `now`, through `now` (inclusive). */
export function getUtcThisWeekSoFarBounds(now = new Date()): { start: Date; end: Date } {
  const dow = now.getUTCDay(); // 0 Sun .. 6 Sat
  const deltaToMonday = dow === 0 ? -6 : 1 - dow;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + deltaToMonday, 0, 0, 0, 0)
  );
  return { start, end: now };
}

/** First day of the UTC month at 00:00:00.000 through `now` (inclusive). */
export function getUtcThisMonthSoFarBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return { start, end: now };
}
