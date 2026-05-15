/** Default country calling code shown on the registration form. */
export const PH_MOBILE_PREFIX = '+63';

/**
 * Normalize a mobile value to E.164-style +63 followed by national digits.
 * Accepts local input (9xx…), 09xx…, or +63… pasted in full.
 */
export function normalizePhilippinesContact(input: unknown): string {
  const raw = input != null ? String(input) : '';
  const digitsAll = raw.replace(/\D/g, '');
  if (!digitsAll) return '';
  let national = digitsAll;
  if (national.startsWith('63')) national = national.slice(2);
  if (national.startsWith('0')) national = national.slice(1);
  return PH_MOBILE_PREFIX + national;
}

/** True when there is no subscriber number after +63 (empty or country-only). */
export function isPhilippinesContactIncomplete(normalized: string): boolean {
  return !normalized || normalized.length <= PH_MOBILE_PREFIX.length;
}
