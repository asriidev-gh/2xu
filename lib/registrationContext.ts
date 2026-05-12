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

function buildLocationLabel(
  city: string | null,
  region: string | null,
  country: string | null
): string | null {
  const parts = [city, region, country].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) return null;
  return parts.join(', ');
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
  const city =
    headerFirst(request, 'x-vercel-ip-city') ||
    headerFirst(request, 'cf-ipcity') ||
    headerFirst(request, 'x-appengine-city');
  const region =
    headerFirst(request, 'x-vercel-ip-country-region') ||
    headerFirst(request, 'cf-region') ||
    headerFirst(request, 'x-appengine-region');
  const country =
    headerFirst(request, 'x-vercel-ip-country') ||
    headerFirst(request, 'cf-ipcountry') ||
    headerFirst(request, 'x-appengine-country');

  return {
    ip: getClientIp(request),
    userAgent,
    deviceType: inferDeviceType(userAgent),
    city,
    region,
    country,
    locationLabel: buildLocationLabel(city, region, country),
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
  const locationLabel =
    parseOptionalString(signupContext.locationLabel, 200) ||
    buildLocationLabel(
      parseOptionalString(signupContext.city, 120),
      parseOptionalString(signupContext.region, 120),
      parseOptionalString(signupContext.country, 120)
    ) ||
    '';

  return {
    ip: parseOptionalString(signupContext.ip, 80) || '',
    locationLabel,
    deviceType: formatDeviceTypeLabel(signupContext.deviceType),
    userAgent: parseOptionalString(signupContext.userAgent, 500) || '',
  };
}
