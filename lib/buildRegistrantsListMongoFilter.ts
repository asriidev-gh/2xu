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
  const withPromoRaw = searchParams.get('withPromo') || '';
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

  const withPromoOnly = withPromoRaw === '1' || withPromoRaw.toLowerCase() === 'true';
  const promoTrim = promoCode.trim();

  function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (withPromoOnly && promoTrim) {
    if (!Array.isArray(filter.$and)) {
      filter.$and = [];
    }
    (filter.$and as Record<string, unknown>[]).push(
      { promoCode: { $regex: /\S/ } },
      { promoCode: { $regex: escapeRegExp(promoTrim), $options: 'i' } }
    );
  } else if (withPromoOnly) {
    filter.promoCode = { $regex: /\S/ };
  } else if (promoTrim) {
    filter.promoCode = { $regex: escapeRegExp(promoTrim), $options: 'i' };
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
    if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }
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
