import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PROMO_CODE_LENGTH = 6;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    const envCode = process.env.PROMO_CODE?.trim() ?? '';

    if (!envCode || envCode.length !== PROMO_CODE_LENGTH) {
      return NextResponse.json({ valid: false });
    }

    const valid = code.length === PROMO_CODE_LENGTH && code === envCode;
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
