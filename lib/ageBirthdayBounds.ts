/** Local-calendar YYYY-MM-DD for age filtering (matches registrants completed-years logic). */

export function formatISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Latest birth date (inclusive) for someone who is at least `minAge` today. */
export function maxBirthDateForMinAge(minAge: number, today: Date): string {
  const d = new Date(today);
  d.setFullYear(d.getFullYear() - minAge);
  return formatISODateLocal(d);
}

/** Earliest birth date (inclusive) for someone who is at most `maxAge` today. */
export function minBirthDateForMaxAge(maxAge: number, today: Date): string {
  const tooOldIfBornOn = new Date(today);
  tooOldIfBornOn.setFullYear(tooOldIfBornOn.getFullYear() - (maxAge + 1));
  const justYoungEnough = new Date(tooOldIfBornOn);
  justYoungEnough.setDate(justYoungEnough.getDate() + 1);
  return formatISODateLocal(justYoungEnough);
}

/** Inclusive birthday YYYY-MM-DD bounds for completed ages in [ageMin, ageMax] (server-local `today`). */
export function getCompletedAgeBirthdayStringBounds(
  ageMin: number,
  ageMax: number,
  today: Date = new Date()
): { minBirth: string; maxBirth: string } {
  return {
    minBirth: minBirthDateForMaxAge(ageMax, today),
    maxBirth: maxBirthDateForMinAge(ageMin, today),
  };
}

export function getAgeBirthdayMatchClauses(
  ageMin: number,
  ageMax: number,
  today: Date = new Date()
): [{ birthday: { $gte: string; $lte: string } }, { birthday: { $regex: RegExp } }] {
  const { minBirth, maxBirth } = getCompletedAgeBirthdayStringBounds(ageMin, ageMax, today);
  return [
    { birthday: { $gte: minBirth, $lte: maxBirth } },
    { birthday: { $regex: /^\d{4}-\d{2}-\d{2}$/ } },
  ];
}

export type AgeBirthdayClause = ReturnType<typeof getAgeBirthdayMatchClauses>[number];

/** ANDs birthday age clauses into an existing Mongo filter (handles top-level `$or` for mailer pending). */
export function mergeBirthdayAgeClausesIntoFilter(
  filter: Record<string, unknown>,
  ageClauses: [AgeBirthdayClause, AgeBirthdayClause]
): void {
  if (filter.$or) {
    const pendingOr = filter.$or;
    delete filter.$or;
    const restAnd = Array.isArray(filter.$and) ? filter.$and : [];
    filter.$and = [...restAnd, { $or: pendingOr }, ...ageClauses];
  } else if (Array.isArray(filter.$and)) {
    filter.$and.push(...ageClauses);
  } else {
    filter.$and = [...ageClauses];
  }
}
