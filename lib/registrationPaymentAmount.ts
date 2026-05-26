import { getRegistrationBasePrice } from '@/lib/raceCategories';

const MISSION_STRONG_PROMO = 'MISSIONSTRONG500';
const SPECIAL_PROMO_REGEX = /^SPSUAAPELITE\d+$/i;

export type RegistrationPaymentAmount = {
  phpAmount: number;
  usdDisplay: string;
  promoCodeLabel?: string;
};

export function formatRaceCategoryLabel(raceCategory: string, speedDistance?: string) {
  const base = raceCategory?.trim() || '';
  const speed = speedDistance?.trim();
  return speed ? `${base} (${speed})` : base;
}

export function computeRegistrationPaymentAmount(
  raceCategory: string,
  promoCode = '',
  speedDistance = ''
): RegistrationPaymentAmount | null {
  const basePrice = getRegistrationBasePrice(raceCategory, speedDistance);
  if (!basePrice) return null;

  const basePhpAmount = basePrice.phpAmount;
  const normalizedPromo = promoCode.trim().toUpperCase();

  if (SPECIAL_PROMO_REGEX.test(normalizedPromo)) {
    return {
      phpAmount: 995,
      usdDisplay: '$18',
      promoCodeLabel: normalizedPromo || 'SPSUAAPElite',
    };
  }

  if (normalizedPromo === MISSION_STRONG_PROMO) {
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
