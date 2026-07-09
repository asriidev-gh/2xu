const MANILA_TZ = 'Asia/Manila';

/** Default FC promo day (Asia/Manila). Override with NEXT_PUBLIC_FC_PROMO_DAY_DATE=YYYY-MM-DD */
const DEFAULT_FC_PROMO_DAY_DATE = '2026-07-01';

/** Calendar date (Asia/Manila) when FC codes are ₱999 with Baguio singlet promo. */
export const FC_PROMO_DAY_DATE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FC_PROMO_DAY_DATE?.trim()) ||
  DEFAULT_FC_PROMO_DAY_DATE;

export const FC_STANDARD_RATE_PHP = 1200;
export const FC_STANDARD_RATE_USD_DISPLAY = '$21';

export const FC_PROMO_DAY_RATE_PHP = 999;
export const FC_PROMO_DAY_RATE_USD_DISPLAY = '$18';
export const FC_PROMO_DAY_SINGLET_LABEL = 'Limited Edition Singlet for Baguio';

/** @deprecated Use getFcAdvocatePricing() — standard FC rate after promo day. */
export const VIP_SPEED_RATE_PHP = FC_STANDARD_RATE_PHP;
/** @deprecated Use getFcAdvocatePricing() */
export const VIP_SPEED_RATE_USD_DISPLAY = FC_STANDARD_RATE_USD_DISPLAY;

export const BASECAMP_EXPERIENCE_TITLE = 'THE BASECAMP EXPERIENCE';

export const BASECAMP_EXPERIENCE_ITEMS = [
  '2XU Speed Series Trail Run → 2KM/ 5KM/ 10KM altitude test at 1450 MASL',
  'Limited Edition 2XU Race Singlet',
  '2XU Recovery Session → Move, breathe, reset with 2XU Compression',
  'Coffee Camp → Connect with your crew, post-run',
  'Sports Photography → Capture your Basecamp moment',
  'Prospex Navigation Quest → Learn trails, map skills, and route strategy',
  'Green Talk → Athlete education: fueling, pacing, mindset.',
  'Music and after run party',
] as const;

export type FcAdvocatePricing = {
  phpAmount: number;
  usdDisplay: string;
  isPromoDay: boolean;
  singletNote: string | null;
};

function formatManilaCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TZ }).format(date);
}

export function isFcPromoDayActive(now = new Date()): boolean {
  return formatManilaCalendarDate(now) === FC_PROMO_DAY_DATE;
}

export function getFcAdvocatePricing(now = new Date()): FcAdvocatePricing {
  if (isFcPromoDayActive(now)) {
    return {
      phpAmount: FC_PROMO_DAY_RATE_PHP,
      usdDisplay: FC_PROMO_DAY_RATE_USD_DISPLAY,
      isPromoDay: true,
      singletNote: FC_PROMO_DAY_SINGLET_LABEL,
    };
  }

  return {
    phpAmount: FC_STANDARD_RATE_PHP,
    usdDisplay: FC_STANDARD_RATE_USD_DISPLAY,
    isPromoDay: false,
    singletNote: null,
  };
}

export function getVipSpeedRateLabel(now = new Date()): string {
  const { phpAmount, isPromoDay } = getFcAdvocatePricing(now);
  const formatted = `₱${phpAmount.toLocaleString('en-PH')} VIP Speed Rate`;
  return isPromoDay ? `${formatted} — Today Only!` : formatted;
}

export function formatVipSpeedRatePhp(now = new Date()): string {
  return `₱${getFcAdvocatePricing(now).phpAmount.toLocaleString('en-PH')}`;
}

export function getFcPromoFootnote(now = new Date()): string {
  const { isPromoDay } = getFcAdvocatePricing(now);
  if (isPromoDay) {
    return `₱${FC_PROMO_DAY_RATE_PHP.toLocaleString('en-PH')} today only with Founders Club promo codes (FC000001–FC000500), includes ${FC_PROMO_DAY_SINGLET_LABEL}. Standard ₱${FC_STANDARD_RATE_PHP.toLocaleString('en-PH')} VIP rate resumes after today.`;
  }
  return `₱${FC_STANDARD_RATE_PHP.toLocaleString('en-PH')} VIP Speed Rate available with Founders Club promo codes (FC000001–FC000500).`;
}
