import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { isAcceptedPromoCode, normalizePromoCode, promoRequiresSingleUseCheck } from '@/lib/promoCodes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPromo = body?.promoCode != null ? normalizePromoCode(String(body.promoCode)) : '';
    const raceCategory = body?.raceCategory != null ? String(body.raceCategory).trim() : '';

    if (!rawPromo) {
      return NextResponse.json({ valid: false, error: 'Promo code is required.' }, { status: 400 });
    }

    if (!isAcceptedPromoCode(rawPromo, raceCategory)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid Promo Code',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');
    const existingWithPromo = promoRequiresSingleUseCheck(rawPromo)
      ? await collection.findOne({ promoCode: rawPromo })
      : null;

    if (existingWithPromo) {
      return NextResponse.json(
        { valid: false, error: 'Promo code already used. Please use a different code.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ valid: true, promoCode: rawPromo }, { status: 200 });
  } catch (error) {
    console.error('Validate promo error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate promo code' }, { status: 500 });
  }
}
