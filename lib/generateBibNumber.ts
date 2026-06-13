import { ObjectId } from 'mongodb';

/** e.g. 5KM → 5K */
export function formatDistanceCategoryLabel(speedDistance: string): string {
  const normalized = speedDistance.trim().toUpperCase();
  if (!normalized) return '—';
  return normalized.replace(/KM$/i, 'K');
}

/** Unique bib from category + last 4 hex chars of registration id (e.g. 5K-A3F2). */
export function generateBibNumber(speedDistance: string, registrationId: ObjectId | string): string {
  const category = formatDistanceCategoryLabel(speedDistance);
  const idHex = String(registrationId).replace(/[^a-f0-9]/gi, '');
  const suffix = idHex.slice(-4).toUpperCase() || '0000';
  return `${category}-${suffix}`;
}
