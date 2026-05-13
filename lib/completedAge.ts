/** Completed years (local calendar), aligned with registrants list and age filters. */

export function parseBirthdayLocal(birthday: string): Date | null {
  const trimmed = birthday?.trim() ?? '';
  if (!trimmed) return null;
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDay) {
    const y = Number(isoDay[1]);
    const m = Number(isoDay[2]) - 1;
    const day = Number(isoDay[3]);
    const d = new Date(y, m, day);
    if (d.getFullYear() === y && d.getMonth() === m && d.getDate() === day) return d;
    return null;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Full years since birthday; null if missing, invalid, future, or implausible. */
export function getAgeYearsFromBirthday(birthday: string): number | null {
  const birth = parseBirthdayLocal(birthday);
  if (!birth) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) return null;
  return age;
}

export function formatCompletedAgeLabel(ageYears: number): string {
  return `(${ageYears} yr${ageYears === 1 ? '' : 's'} old)`;
}
