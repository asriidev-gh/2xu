export const VIP_SPEED_RATE_PHP = 1500;
export const VIP_SPEED_RATE_USD_DISPLAY = '$27';
export const VIP_SPEED_RATE_LABEL = '₱1,500 VIP Speed Rate';

export const BASECAMP_EXPERIENCE_TITLE = 'THE BASECAMP EXPERIENCE';

export const BASECAMP_EXPERIENCE_ITEMS = [
  '2XU Speed Series Trail Run → 2KM/ 5KM altitude test at 1450 MASL',
  'Limited Edition 2XU Race Singlet',
  '2XU Recovery Session → Move, breathe, reset with 2XU Compression',
  'Coffee Camp → Connect with your crew, post-run',
  'Sports Photography → Capture your Basecamp moment',
  'Prospex Navigation Quest → Learn trails, map skills, and route strategy',
  'Green Talk → Athlete education: fueling, pacing, mindset.',
  'Music and after run party',
] as const;

export function formatVipSpeedRatePhp(): string {
  return `₱${VIP_SPEED_RATE_PHP.toLocaleString('en-PH')}`;
}
