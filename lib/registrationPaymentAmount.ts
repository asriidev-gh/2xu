import { getRegistrationBasePrice } from '@/lib/raceCategories';
import {
  FC_ADVOCATE_FIXED_PHP,
  FC_ADVOCATE_USD_DISPLAY,
  isFcAdvocatePromoCode,
  isMissionStrongPromoCode,
  isSpecialAthletesPromoCode,
  normalizePromoCode,
} from '@/lib/promoCodes';

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
  const normalizedPromo = normalizePromoCode(promoCode);

  if (isSpecialAthletesPromoCode(normalizedPromo)) {
    return {
      phpAmount: 995,
      usdDisplay: '$18',
      promoCodeLabel: normalizedPromo || 'SPSUAAPElite',
    };
  }

  if (isMissionStrongPromoCode(normalizedPromo)) {
    return {
      phpAmount: Math.max(0, basePhpAmount - 500),
      usdDisplay: basePrice.priceUsd,
      promoCodeLabel: normalizedPromo,
    };
  }

  if (isFcAdvocatePromoCode(normalizedPromo)) {
    return {
      phpAmount: FC_ADVOCATE_FIXED_PHP,
      usdDisplay: FC_ADVOCATE_USD_DISPLAY,
      promoCodeLabel: normalizedPromo,
    };
  }

  return {
    phpAmount: basePhpAmount,
    usdDisplay: basePrice.priceUsd,
  };
}
