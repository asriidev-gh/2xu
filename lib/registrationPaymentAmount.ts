import { RACE_CATEGORY_PRICES } from '@/lib/raceCategories';

const MISSION_STRONG_PROMO = 'MISSIONSTRONG500';
const MISSION_STRONG_ELIGIBLE_CATEGORIES = new Set(['Youth Category', 'Advocate / Influencer']);
const SPECIAL_PROMO_REGEX = /^SPSUAAPELITE\d+$/i;

export type RegistrationPaymentAmount = {
  phpAmount: number;
  usdDisplay: string;
  promoCodeLabel?: string;
};

export function formatRaceCategoryLabel(raceCategory: string, patronSpeedDistance?: string) {
  const base = raceCategory?.trim() || '';
  if (base !== 'Patron') return base;
  const speed = patronSpeedDistance?.trim();
  return speed ? `Patron (${speed})` : base;
}

export function computeRegistrationPaymentAmount(
  raceCategory: string,
  promoCode = ''
): RegistrationPaymentAmount | null {
  const basePrice = RACE_CATEGORY_PRICES[raceCategory];
  if (!basePrice) return null;

  const basePhpAmount = parseInt(basePrice.pricePhp.replace(/[^\d]/g, ''), 10) || 0;
  const normalizedPromo = promoCode.trim().toUpperCase();

  if (SPECIAL_PROMO_REGEX.test(normalizedPromo)) {
    return {
      phpAmount: 995,
      usdDisplay: '$18',
      promoCodeLabel: normalizedPromo || 'SPSUAAPElite',
    };
  }

  if (
    normalizedPromo === MISSION_STRONG_PROMO &&
    MISSION_STRONG_ELIGIBLE_CATEGORIES.has(raceCategory)
  ) {
    return {
      phpAmount: Math.max(0, basePhpAmount - 500),
      usdDisplay: basePrice.priceUsd,
      promoCodeLabel: MISSION_STRONG_PROMO,
    };
  }

  return {
    phpAmount: basePhpAmount,
    usdDisplay: basePrice.priceUsd,
  };
}
