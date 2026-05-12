type AffiliationAliasGroup = {
  canonical: string;
  displayName: string;
  variants: readonly string[];
};

const AFFILIATION_ALIAS_GROUPS: readonly AffiliationAliasGroup[] = [
  {
    canonical: 'national university',
    displayName: 'National University',
    variants: [
      'national university',
      'national university manila',
      'natial university',
      'naitonal university',
    ],
  },
];

const VARIANT_TO_CANONICAL = new Map<string, string>();
const CANONICAL_TO_GROUP = new Map<string, AffiliationAliasGroup>();

for (const group of AFFILIATION_ALIAS_GROUPS) {
  CANONICAL_TO_GROUP.set(group.canonical, group);
  for (const variant of group.variants) {
    VARIANT_TO_CANONICAL.set(variant, group.canonical);
  }
}

function normalizeAffiliationValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Canonical key for grouping and filtering affiliation strings. */
export function normalizeAffiliationKey(value: string): string {
  const normalized = normalizeAffiliationValue(value);
  return VARIANT_TO_CANONICAL.get(normalized) ?? normalized;
}

export function getAffiliationMatchKeys(value: string): string[] {
  const canonical = normalizeAffiliationKey(value);
  const group = CANONICAL_TO_GROUP.get(canonical);
  return group ? [...group.variants] : [canonical];
}

export function getAffiliationDisplayName(
  canonicalKey: string,
  rawCounts: Map<string, number>
): string {
  const group = CANONICAL_TO_GROUP.get(canonicalKey);
  if (group) return group.displayName;

  let best = canonicalKey;
  let bestCount = 0;
  for (const [raw, count] of rawCounts) {
    if (count > bestCount) {
      best = raw.trim();
      bestCount = count;
    }
  }
  return best;
}

export function buildClubAffiliationFilter(value: string): Record<string, unknown> {
  const matchKeys = getAffiliationMatchKeys(value);
  const affiliationExpr = {
    $toLower: { $trim: { input: { $ifNull: ['$affiliations', ''] } } },
  };

  if (matchKeys.length === 1) {
    return {
      $expr: {
        $eq: [affiliationExpr, matchKeys[0]],
      },
    };
  }

  return {
    $expr: {
      $in: [affiliationExpr, matchKeys],
    },
  };
}

export function mergeAffiliationCounts(
  rows: { raw: string; count: number }[]
): { name: string; count: number }[] {
  const merged = new Map<string, { count: number; rawCounts: Map<string, number> }>();

  for (const row of rows) {
    const raw = String(row.raw ?? '');
    const key = normalizeAffiliationKey(raw);
    const entry = merged.get(key) ?? { count: 0, rawCounts: new Map<string, number>() };
    entry.count += row.count;
    entry.rawCounts.set(raw, (entry.rawCounts.get(raw) ?? 0) + row.count);
    merged.set(key, entry);
  }

  return [...merged.entries()]
    .map(([key, { count, rawCounts }]) => ({
      name: getAffiliationDisplayName(key, rawCounts),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
