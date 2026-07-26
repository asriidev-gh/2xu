/** Bump when replacing `public/images/baguio_leg.jpg` so browsers fetch the new asset. */
export const BAGUIO_LEG_IMAGE_VERSION = 3;

export const BAGUIO_LEG_IMAGE = `/images/baguio_leg.jpg?v=${BAGUIO_LEG_IMAGE_VERSION}`;

/** Bump when replacing Baguio update slide images in `public/images/updates/`. */
export const BAGUIO_UPDATE_IMAGES_VERSION = 1;

export const BAGUIO_UPDATE_IMAGES = [
  `/images/updates/basecamp_001.png?v=${BAGUIO_UPDATE_IMAGES_VERSION}`,
  `/images/updates/basecamp_002.jpg?v=${BAGUIO_UPDATE_IMAGES_VERSION}`,
] as const;
