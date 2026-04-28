import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const ADVOCATE_PROMO_REGEX = /^SPS2XU\d+$/i;
const SPECIAL_PROMO_REGEX = /^SPSUAAPELITE\d+$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPromo = body?.promoCode != null ? String(body.promoCode).trim().toUpperCase() : '';
    const raceCategory = body?.raceCategory != null ? String(body.raceCategory).trim().toUpperCase() : '';

    if (!rawPromo) {
      return NextResponse.json({ valid: false, error: 'Promo code is required.' }, { status: 400 });
    }

    const isAdvocatePromo = ADVOCATE_PROMO_REGEX.test(rawPromo);
    const isSpecialPromo = SPECIAL_PROMO_REGEX.test(rawPromo);
    const isAthletesCategory = raceCategory === 'ATHLETES CATEGORY';
    const isValidFormat = isAdvocatePromo || (isSpecialPromo && isAthletesCategory);

    if (!isValidFormat) {
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
    const existingWithPromo = await collection.findOne({ promoCode: rawPromo });

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

