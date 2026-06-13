import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() != null;
}

export function isAllowedPaymentProofMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function isPaymentProofUrlFromCloudinary(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('res.cloudinary.com');
  } catch {
    return false;
  }
}

export async function uploadPaymentProofImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; publicId: string }> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error('Cloudinary is not configured');
  }
  if (!isAllowedPaymentProofMimeType(mimeType)) {
    throw new Error('Invalid file type. Upload a JPG, PNG, or WebP image.');
  }
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error('File is too large. Maximum size is 5 MB.');
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'speed-series/payment-proofs',
    resource_type: 'image',
    overwrite: false,
  });

  if (!result.secure_url) {
    throw new Error('Upload failed');
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
