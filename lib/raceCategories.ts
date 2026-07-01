export const TEAM_CATEGORY_NAME = 'Team Category';
export const FOUNDERS_CATEGORY_NAME = 'Mission Strong Founders Club';

export const TEAM_CATEGORY_PHP = 6000;
export const TEAM_CATEGORY_USD = '$107';
export const FOUNDERS_CATEGORY_PHP = 3300;
export const FOUNDERS_CATEGORY_USD = '$59';

/** Flat registration fee for 2KM / 5KM speed options. */
export const SPEED_RUN_FLAT_RATE_PHP = 1500;
export const SPEED_RUN_FLAT_RATE_USD = '$27';

/** Speed distance options (must match API validation and SPEED_DISTANCE_PRICING). */
export const SPEED_DISTANCES = ['2KM', '5KM'] as const;

export const SPEED_DISTANCE_PRICING: Record<
  (typeof SPEED_DISTANCES)[number],
  { php: number; usd: string }
> = {
  '2KM': { php: SPEED_RUN_FLAT_RATE_PHP, usd: SPEED_RUN_FLAT_RATE_USD },
  '5KM': { php: SPEED_RUN_FLAT_RATE_PHP, usd: SPEED_RUN_FLAT_RATE_USD },
};

export const SPEED_DISTANCES_OPTIONS_TEXT = SPEED_DISTANCES.join(', ');

export function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}

export function usesSpeedBasedPricing(raceCategory: string): boolean {
  const cat = raceCategory.trim();
  return cat !== '' && cat !== TEAM_CATEGORY_NAME && cat !== FOUNDERS_CATEGORY_NAME;
}

export function getRegistrationBasePrice(
  raceCategory: string,
  speedDistance?: string
): { phpAmount: number; pricePhp: string; priceUsd: string } | null {
  const cat = raceCategory.trim();
  if (!cat) return null;

  if (cat === TEAM_CATEGORY_NAME) {
    return {
      phpAmount: TEAM_CATEGORY_PHP,
      pricePhp: formatPhp(TEAM_CATEGORY_PHP),
      priceUsd: TEAM_CATEGORY_USD,
    };
  }

  if (cat === FOUNDERS_CATEGORY_NAME) {
    return {
      phpAmount: FOUNDERS_CATEGORY_PHP,
      pricePhp: formatPhp(FOUNDERS_CATEGORY_PHP),
      priceUsd: FOUNDERS_CATEGORY_USD,
    };
  }

  const speed = speedDistance?.trim();
  if (!speed || !(speed in SPEED_DISTANCE_PRICING)) return null;

  const pricing = SPEED_DISTANCE_PRICING[speed as keyof typeof SPEED_DISTANCE_PRICING];
  return {
    phpAmount: pricing.php,
    pricePhp: formatPhp(pricing.php),
    priceUsd: pricing.usd,
  };
}

export type RaceCategoryDefinition = {
  name: string;
  ageGroup: string;
  pricePhp: string;
  priceUsd: string;
  kitValueLabel?: string;
  kitDescription: string;
  /** Replaces the third entitlement bullet (default: jersey kit disclaimer) */
  kitFooterNote?: string;
  highlight?: 'popular' | 'best-value' | 'youth' | 'community' | 'team' | 'duo' | 'founders';
  /** Hidden from public race cards and registration form (dashboard still lists all). */
  hiddenFromRegistration?: boolean;
};

export const raceCategories: RaceCategoryDefinition[] = [
  {
    name: 'Youth Category',
    ageGroup: 'Ages 12 – 25',
    pricePhp: '₱1,500',
    priceUsd: SPEED_RUN_FLAT_RATE_USD,
    kitValueLabel: 'Includes $60 worth of 2XU race kit',
    kitDescription: 'Perfect for emerging runners and student athletes stepping into the 2XU experience.',
    highlight: 'youth',
  },
  {
    name: 'Individual',
    ageGroup: 'Ages 26 and above',
    pricePhp: '₱1,500',
    priceUsd: SPEED_RUN_FLAT_RATE_USD,
    kitValueLabel: 'Includes $70 worth of 2XU race kit',
    kitDescription: 'For dedicated runners who want a complete 2XU race experience and premium kit value.',
    highlight: 'popular',
  },
  {
    name: 'Mission Strong Founders Club',
    ageGroup: 'Pre-register for 3 Speed Series legs',
    pricePhp: '₱3,300',
    priceUsd: '$59',
    kitDescription: '',
    kitFooterNote: '',
    highlight: 'founders',
    hiddenFromRegistration: true,
  },
  {
    name: 'Team Category',
    ageGroup: 'Group of 4 runners',
    pricePhp: '₱6,000',
    priceUsd: '$107',
    kitValueLabel: 'Includes $200 worth of 2XU race kit',
    kitDescription: 'Built for crews, clubs, and friends who want to race, train, and celebrate together.',
    highlight: 'team',
  },
  {
    name: 'The Speed Duo - 2XU pair',
    ageGroup: 'Group of 2 runners',
    pricePhp: '₱1,500',
    priceUsd: SPEED_RUN_FLAT_RATE_USD,
    kitDescription: 'For partners who want to race together as a duo and share the 2XU race experience.',
    highlight: 'duo',
  },
  {
    name: 'Athletes Category',
    ageGroup: 'Ages 16 and above',
    pricePhp: '₱1,500',
    priceUsd: SPEED_RUN_FLAT_RATE_USD,
    kitDescription: 'For competitive and aspiring athletes ready to push performance with 2XU.',
    highlight: 'community',
  },
  {
    name: 'Advocate / Influencer',
    ageGroup: 'Ages 12 and above',
    pricePhp: '₱1,500',
    priceUsd: SPEED_RUN_FLAT_RATE_USD,
    kitDescription: 'For community leaders, advocates, and creators who amplify the 2XU story.',
    highlight: 'community',
  },
  {
    name: 'Patron',
    ageGroup: 'Ages 18+',
    pricePhp: '₱1,500',
    priceUsd: '$27',
    kitDescription: '',
    kitFooterNote: '',
    highlight: 'community',
  },
];

export const RACE_CATEGORY_NAMES: string[] = raceCategories.map((c) => c.name);

export const publicRaceCategories = raceCategories.filter((c) => !c.hiddenFromRegistration);
export const PUBLIC_RACE_CATEGORY_NAMES: string[] = publicRaceCategories.map((c) => c.name);
export const PUBLIC_RACE_CATEGORY_SET = new Set(PUBLIC_RACE_CATEGORY_NAMES);
/** @deprecated Prefer getRegistrationBasePrice — kept for legacy display strings on cards. */
export const RACE_CATEGORY_PRICES: Record<string, { pricePhp: string; priceUsd: string }> =
  Object.fromEntries(raceCategories.map((c) => [c.name, { pricePhp: c.pricePhp, priceUsd: c.priceUsd }]));

export const SPEED_DISTANCES_ALLOWED = new Set<string>(SPEED_DISTANCES);

/** Reads speedDistance; falls back to legacy patronSpeedDistance in stored records. */
export function getStoredSpeedDistance(
  record: { speedDistance?: unknown; patronSpeedDistance?: unknown } | null | undefined
): string {
  const raw = record?.speedDistance ?? record?.patronSpeedDistance;
  return raw != null ? String(raw).trim() : '';
}
