/**
 * Put a new version token in the *filename* when replacing promo assets.
 * Query-string `?v=` alone is not enough on some CDNs that ignore query params.
 */
export const BAGUIO_UPDATE_IMAGES = [
  '/images/updates/basecamp_001-v4.png',
  '/images/updates/basecamp_002-v4.png',
] as const;

/** Home splash uses the same lead Baguio update visual. */
export const BAGUIO_LEG_IMAGE = BAGUIO_UPDATE_IMAGES[0];
