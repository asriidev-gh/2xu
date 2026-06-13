import { NextRequest, NextResponse } from 'next/server';
import {
  isCloudinaryConfigured,
  uploadPaymentProofImage,
} from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Payment proof upload is not configured on the server.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadPaymentProofImage(buffer, mimeType);

    return NextResponse.json({ url, publicId }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload payment proof';
    console.error('[upload/payment-proof]', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
