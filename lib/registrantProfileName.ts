import { getAgeYearsFromBirthday } from '@/lib/completedAge';

export function genderLetterAbbrev(gender: string): string {
  const g = gender?.trim();
  if (g === 'Male') return 'M';
  if (g === 'Female') return 'F';
  if (!g) return '';
  return g.charAt(0).toUpperCase();
}

/** e.g. Andy Radam (M-42 yrs old) */
export function formatRegistrantProfileName(u: {
  name: string;
  gender: string;
  birthday: string;
}): string {
  const abbr = genderLetterAbbrev(u.gender);
  const ageYears = getAgeYearsFromBirthday(u.birthday || '');
  if (abbr && ageYears != null) return `${u.name} (${abbr}-${ageYears} yrs old)`;
  if (abbr) return `${u.name} (${abbr})`;
  if (ageYears != null) return `${u.name} (${ageYears} yrs old)`;
  return u.name;
}
