import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format: SPS2XU + one or more digits (e.g. SPS2XU1, SPS2XU2)
const PROMO_FORMAT = /^SPS2XU\d+$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    const valid = PROMO_FORMAT.test(code);
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
