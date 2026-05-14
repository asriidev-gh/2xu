/**
 * Emails excluded from admin registrant list APIs in production (`next build` / deployed).
 * Local `next dev` uses NODE_ENV=development, so these rows still appear for testing.
 */
const EXCLUDED_FROM_ADMIN_LIST_REGEX = /^andy\.radam@gmail\.com$/i;

/**
 * Merges production-only exclusions into the Mongo filter used by GET /api/users.
 */
export function mergeRegistrantsListFilterForEnv<T extends Record<string, unknown>>(
  filter: T
): Record<string, unknown> {
  if (process.env.NODE_ENV !== 'production') {
    return filter;
  }
  return {
    $and: [
      filter,
      {
        $nor: [
          {
            email: {
              $regex: EXCLUDED_FROM_ADMIN_LIST_REGEX.source,
              $options: 'i',
            },
          },
        ],
      },
    ],
  };
}
