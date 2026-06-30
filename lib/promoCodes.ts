export const MISSION_STRONG_PROMO = 'MISSIONSTRONG500';
export const FC_ADVOCATE_DISCOUNT_PERCENT = 20;

const SPS2XU_ADVOCATE_REGEX = /^SPS2XU\d+$/i;
const SPECIAL_ATHLETES_REGEX = /^SPSUAAPELITE\d+$/i;
const ATHLETES_CATEGORY = 'ATHLETES CATEGORY';

export function normalizePromoCode(promo: string): string {
  return String(promo || '').trim().toUpperCase();
}

/** SPS2XU advocate codes (payment proof not required). */
export function isSps2xuAdvocatePromoCode(promo: string): boolean {
  return SPS2XU_ADVOCATE_REGEX.test(normalizePromoCode(promo));
}

/** Alias for SPS2XU advocate codes that bypass payment proof. */
export function isAdvocatePromoCode(promo: string): boolean {
  return isSps2xuAdvocatePromoCode(promo);
}

/** Founders Club codes FC000001–FC000500 (single-use, 20% discount, payment still required). */
export function isFcAdvocatePromoCode(promo: string): boolean {
  const normalized = normalizePromoCode(promo);
  const match = /^FC(\d{6})$/.exec(normalized);
  if (!match) return false;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 500;
}

export function isSpecialAthletesPromoCode(promo: string): boolean {
  return SPECIAL_ATHLETES_REGEX.test(normalizePromoCode(promo));
}

export function isMissionStrongPromoCode(promo: string): boolean {
  return normalizePromoCode(promo) === MISSION_STRONG_PROMO;
}

export function isAcceptedPromoCode(promo: string, raceCategory: string): boolean {
  const raw = normalizePromoCode(promo);
  if (!raw) return false;
  if (isSps2xuAdvocatePromoCode(raw)) return true;
  if (isFcAdvocatePromoCode(raw)) return true;
  if (isMissionStrongPromoCode(raw)) return true;
  if (isSpecialAthletesPromoCode(raw) && raceCategory.trim().toUpperCase() === ATHLETES_CATEGORY) {
    return true;
  }
  return false;
}

export function promoRequiresSingleUseCheck(promo: string): boolean {
  return !isMissionStrongPromoCode(promo);
}
