import type { NextRequest } from 'next/server';

export type SignupDeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export type ClientSignupContext = {
  timezone?: string | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  language?: string | null;
};

export type SignupContext = {
  ip: string | null;
  userAgent: string | null;
  deviceType: SignupDeviceType;
  city: string | null;
  region: string | null;
  country: string | null;
  locationLabel: string | null;
  timezone: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  language: string | null;
  capturedAt: Date;
};

export type SignupContextView = {
  ip: string;
  locationLabel: string;
  deviceType: string;
  userAgent: string;
};

function headerFirst(request: NextRequest, name: string): string | null {
  const value = request.headers.get(name);
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = headerFirst(request, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headerFirst(request, 'x-real-ip');
  if (realIp) return realIp;

  const requestIp = (request as NextRequest & { ip?: string | null }).ip;
  if (requestIp && requestIp.trim()) return requestIp.trim();

  return null;
}

function inferDeviceType(userAgent: string | null): SignupDeviceType {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return 'mobile';
  if (/android|windows|macintosh|linux|cros/.test(ua)) return 'desktop';
  return 'unknown';
}

const CITY_PROVINCE_NOT_RECORDED_SUFFIX = '(City/Province not recorded)';

function appendMissingCitySuffix(label: string): string {
  if (!label || label.endsWith(CITY_PROVINCE_NOT_RECORDED_SUFFIX)) return label;
  return `${label} ${CITY_PROVINCE_NOT_RECORDED_SUFFIX}`;
}

function buildLocationLabel(
  city: string | null,
  region: string | null,
  country: string | null
): string | null {
  const cityPart = city?.trim() ? formatLocationPart(city, 'city') : '';
  const regionPart = region?.trim() ? formatLocationPart(region, 'region') : '';
  const countryPart = country?.trim() ? formatLocationPart(country, 'country') : '';
  const parts = [cityPart, regionPart, countryPart].filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;

  const label = parts.join(', ');
  if (!cityPart) return appendMissingCitySuffix(label);
  return label;
}

export function normalizeLocationString(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!/%[0-9A-Fa-f]{2}/.test(trimmed)) return trimmed;
  try {
    return decodeURIComponent(trimmed.replace(/\+/g, ' ')).trim().replace(/\s+/g, ' ');
  } catch {
    return trimmed.replace(/%20/gi, ' ');
  }
}

function formatCountryLabel(country: string): string {
  const normalized = normalizeLocationString(country);
  if (!/^[A-Za-z]{2}$/.test(normalized)) return normalized;
  try {
    const displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(
      normalized.toUpperCase()
    );
    if (displayName) return displayName;
  } catch {
    // Intl.DisplayNames is unavailable in some runtimes.
  }
  return normalized.toUpperCase();
}

export function formatSignupLocationDisplayLabel(
  label: string,
  options?: { hasCity?: boolean }
): string {
  const normalized = normalizeLocationString(label);
  if (!normalized) return '';
  if (/^[A-Za-z]{2}$/.test(normalized)) {
    return appendMissingCitySuffix(formatCountryLabel(normalized));
  }

  const parts = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';

  const formatted = parts
    .map((part, index) => (index === parts.length - 1 ? formatCountryLabel(part) : part))
    .join(', ');

  if (options?.hasCity === false || (options?.hasCity !== true && parts.length === 1)) {
    return appendMissingCitySuffix(formatted);
  }

  return formatted;
}

export function formatSignupLocationDisplayLabelFromParts(
  city: string | null | undefined,
  region: string | null | undefined,
  country: string | null | undefined,
  fallbackLabel = ''
): string {
  const cityPart = city?.trim() ? formatLocationPart(city, 'city') : '';
  const regionPart = region?.trim() ? formatLocationPart(region, 'region') : '';
  const countryPart = country?.trim() ? formatLocationPart(country, 'country') : '';

  if (cityPart || regionPart || countryPart) {
    const parts = [cityPart, regionPart, countryPart].filter((part): part is string => Boolean(part));
    if (parts.length === 0) return '';
    const label = parts.join(', ');
    if (!cityPart) return appendMissingCitySuffix(label);
    return label;
  }

  return formatSignupLocationDisplayLabel(fallbackLabel);
}

function formatLocationPart(part: string, kind: 'city' | 'region' | 'country'): string {
  const normalized = normalizeLocationString(part);
  if (!normalized) return '';
  return kind === 'country' ? formatCountryLabel(normalized) : normalized;
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function parseOptionalString(value: unknown, maxLength = 120): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function buildSignupContext(
  request: NextRequest,
  clientContext?: ClientSignupContext | null
): SignupContext {
  const userAgent = headerFirst(request, 'user-agent');
  const city = normalizeLocationString(
    headerFirst(request, 'x-vercel-ip-city') ||
      headerFirst(request, 'cf-ipcity') ||
      headerFirst(request, 'x-appengine-city') ||
      ''
  );
  const region = normalizeLocationString(
    headerFirst(request, 'x-vercel-ip-country-region') ||
      headerFirst(request, 'cf-region') ||
      headerFirst(request, 'x-appengine-region') ||
      ''
  );
  const country = normalizeLocationString(
    headerFirst(request, 'x-vercel-ip-country') ||
      headerFirst(request, 'cf-ipcountry') ||
      headerFirst(request, 'x-appengine-country') ||
      ''
  );

  return {
    ip: getClientIp(request),
    userAgent,
    deviceType: inferDeviceType(userAgent),
    city: city || null,
    region: region || null,
    country: country || null,
    locationLabel: buildLocationLabel(city || null, region || null, country || null),
    timezone: parseOptionalString(clientContext?.timezone, 80),
    screenWidth: parseOptionalNumber(clientContext?.screenWidth),
    screenHeight: parseOptionalNumber(clientContext?.screenHeight),
    language: parseOptionalString(clientContext?.language, 40),
    capturedAt: new Date(),
  };
}

function formatDeviceTypeLabel(deviceType: SignupDeviceType | string | null | undefined): string {
  switch (deviceType) {
    case 'mobile':
      return 'Mobile';
    case 'tablet':
      return 'Tablet';
    case 'desktop':
      return 'Desktop';
    default:
      return 'Unknown';
  }
}

export function formatSignupContextView(context: unknown): SignupContextView {
  if (!context || typeof context !== 'object') {
    return {
      ip: '',
      locationLabel: '',
      deviceType: '',
      userAgent: '',
    };
  }

  const signupContext = context as Partial<SignupContext>;
  const locationLabel = formatSignupLocationDisplayLabelFromParts(
    parseOptionalString(signupContext.city, 120),
    parseOptionalString(signupContext.region, 120),
    parseOptionalString(signupContext.country, 120),
    parseOptionalString(signupContext.locationLabel, 200) || ''
  );

  return {
    ip: parseOptionalString(signupContext.ip, 80) || '',
    locationLabel,
    deviceType: formatDeviceTypeLabel(signupContext.deviceType),
    userAgent: parseOptionalString(signupContext.userAgent, 500) || '',
  };
}
