export type RaceCategoryDefinition = {
  name: string;
  ageGroup: string;
  pricePhp: string;
  priceUsd: string;
  kitValueLabel?: string;
  kitDescription: string;
  /** Replaces the third entitlement bullet (default: jersey kit disclaimer) */
  kitFooterNote?: string;
  highlight?: 'popular' | 'best-value' | 'youth' | 'community' | 'team' | 'duo';
};

export const raceCategories: RaceCategoryDefinition[] = [
  {
    name: 'Youth Category',
    ageGroup: 'Ages 12 – 25',
    pricePhp: '₱1,800',
    priceUsd: '$32',
    kitValueLabel: 'Includes $60 worth of 2XU race kit',
    kitDescription: 'Perfect for emerging runners and student athletes stepping into the 2XU experience.',
    highlight: 'youth',
  },
  {
    name: 'Individual',
    ageGroup: 'Ages 26 and above',
    pricePhp: '₱1,990',
    priceUsd: '$40',
    kitValueLabel: 'Includes $70 worth of 2XU race kit',
    kitDescription: 'For dedicated runners who want a complete 2XU race experience and premium kit value.',
    highlight: 'popular',
  },
  {
    name: 'Team Category',
    ageGroup: 'Group of 4 runners',
    pricePhp: '₱6,900',
    priceUsd: '$120',
    kitValueLabel: 'Includes $200 worth of 2XU race kit',
    kitDescription: 'Built for crews, clubs, and friends who want to race, train, and celebrate together.',
    highlight: 'team',
  },
  {
    name: 'The Speed Duo - 2XU pair',
    ageGroup: 'Group of 2 runners',
    pricePhp: '₱3,200',
    priceUsd: '$56',
    kitDescription: 'For partners who want to race together as a duo and share the 2XU race experience.',
    highlight: 'duo',
  },
  {
    name: 'Athletes Category',
    ageGroup: 'Ages 16 and above',
    pricePhp: '₱1,800',
    priceUsd: '$32',
    kitDescription: 'For competitive and aspiring athletes ready to push performance with 2XU.',
    highlight: 'community',
  },
  {
    name: 'Advocate / Influencer',
    ageGroup: 'Ages 12 and above',
    pricePhp: '₱1,800',
    priceUsd: '$32',
    kitDescription: 'For community leaders, advocates, and creators who amplify the 2XU story.',
    highlight: 'community',
  },
  {
    name: 'Patron',
    ageGroup: 'Ages 18+',
    pricePhp: '₱2,800',
    priceUsd: '$47',
    kitDescription: '',
    kitFooterNote: '',
    highlight: 'community',
  },
];

export const RACE_CATEGORY_NAMES: string[] = raceCategories.map((c) => c.name);
export const RACE_CATEGORY_PRICES: Record<string, { pricePhp: string; priceUsd: string }> =
  Object.fromEntries(raceCategories.map((c) => [c.name, { pricePhp: c.pricePhp, priceUsd: c.priceUsd }]));

/** Patron-only speed distances (must match API validation). */
export const PATRON_SPEED_DISTANCES = ['2KM', '5KM', '10KM', '21KM'] as const;
