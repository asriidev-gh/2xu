import { getAgeBirthdayMatchClauses, mergeBirthdayAgeClausesIntoFilter } from '@/lib/ageBirthdayBounds';
import { mergeRegistrantsListFilterForEnv } from '@/lib/productionRegistrantExclusions';

const AGE_CAP = 120;

/**
 * Builds the same Mongo filter as GET /api/users (list + export), from dashboard query params.
 * Ignores pagination and sort params.
 */
export function buildRegistrantsListMongoFilterFromSearchParams(
  searchParams: URLSearchParams
): Record<string, unknown> {
  const name = searchParams.get('name') || '';
  const email = searchParams.get('email') || '';
  const gender = searchParams.get('gender') || '';
  const raceCategory = searchParams.get('raceCategory') || '';
  const club = searchParams.get('club') || '';
  const promoCode = searchParams.get('promoCode') || '';
  const emailStatus = searchParams.get('emailStatus') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const ageMinRaw = searchParams.get('ageMin');
  const ageMaxRaw = searchParams.get('ageMax');

  const filter: Record<string, unknown> = {};

  if (name) {
    filter.name = { $regex: name, $options: 'i' };
  }

  if (email) {
    filter.email = { $regex: email, $options: 'i' };
  }

  if (gender) {
    filter.gender = gender;
  }

  if (raceCategory) {
    filter.raceCategory = raceCategory;
  }

  if (club) {
    filter.affiliations = club;
  }

  if (promoCode) {
    filter.promoCode = { $regex: promoCode.trim(), $options: 'i' };
  }

  if (emailStatus && ['success', 'failed', 'pending'].includes(emailStatus)) {
    if (emailStatus === 'pending') {
      filter.$or = [
        { mailerStatus: 'pending' },
        { mailerStatus: { $exists: false } },
        { mailerStatus: null },
        { mailerStatus: '' },
      ];
    } else {
      filter.mailerStatus = emailStatus;
    }
  }

  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) {
      createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      createdAt.$lte = endDate;
    }
    filter.createdAt = createdAt;
  }

  let ageMin = 0;
  let ageMax = AGE_CAP;
  if (ageMinRaw !== null && ageMinRaw !== '') {
    const n = parseInt(ageMinRaw, 10);
    if (!Number.isNaN(n)) ageMin = Math.min(AGE_CAP, Math.max(0, n));
  }
  if (ageMaxRaw !== null && ageMaxRaw !== '') {
    const n = parseInt(ageMaxRaw, 10);
    if (!Number.isNaN(n)) ageMax = Math.min(AGE_CAP, Math.max(0, n));
  }
  if (ageMin > ageMax) {
    const t = ageMin;
    ageMin = ageMax;
    ageMax = t;
  }

  if (ageMin > 0 || ageMax < AGE_CAP) {
    const ageClauses = getAgeBirthdayMatchClauses(ageMin, ageMax, new Date());
    mergeBirthdayAgeClausesIntoFilter(filter, ageClauses);
  }

  return mergeRegistrantsListFilterForEnv(filter);
}
