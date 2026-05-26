import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { parseBirthdayLocal } from '@/lib/completedAge';
import { RACE_CATEGORY_NAMES, SPEED_DISTANCES_ALLOWED, getStoredSpeedDistance } from '@/lib/raceCategories';

export const dynamic = 'force-dynamic';

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const GENDERS = ['Male', 'Female'] as const;
const ADVOCATE_PROMO_REGEX = /^SPS2XU\d+$/i;
const SPECIAL_PROMO_REGEX = /^SPSUAAPELITE\d+$/i;
const MISSION_STRONG_PROMO = 'MISSIONSTRONG500';

const RACE_CATEGORY_SET = new Set(RACE_CATEGORY_NAMES);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

function normalizeBirthdayForStorage(birthday: unknown): string | null {
  const trimmed = birthday != null ? String(birthday).trim() : '';
  if (!trimmed) return null;
  const parsed = parseBirthdayLocal(trimmed);
  if (!parsed) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function resolvePromoCodeForUpdate(
  rawInput: string,
  raceCategory: string,
  userId: ObjectId,
  collection: { findOne: (filter: object) => Promise<{ _id: ObjectId } | null> }
): Promise<{ ok: true; promoCode: string } | { ok: false; error: string; status: number }> {
  const rawPromo = rawInput.trim().toUpperCase();
  if (!rawPromo) {
    return { ok: true, promoCode: '' };
  }

  const raceUpper = raceCategory.trim().toUpperCase();
  const isAdvocatePromo = ADVOCATE_PROMO_REGEX.test(rawPromo);
  const isSpecialPromo = SPECIAL_PROMO_REGEX.test(rawPromo);
  const isMissionStrongPromo = rawPromo === MISSION_STRONG_PROMO;
  const isAthletesCategory = raceUpper === 'ATHLETES CATEGORY';
  const isEligibleMissionStrongPromo = isMissionStrongPromo;
  const isValidFormat =
    isAdvocatePromo || (isSpecialPromo && isAthletesCategory) || isEligibleMissionStrongPromo;

  if (!isValidFormat) {
    return { ok: false, error: 'Invalid advocate / promo code for this race category.', status: 400 };
  }

  const requiresSingleUseCheck = !isMissionStrongPromo;
  if (requiresSingleUseCheck) {
    const existingWithPromo = await collection.findOne({ promoCode: rawPromo });
    if (existingWithPromo && !existingWithPromo._id.equals(userId)) {
      return {
        ok: false,
        error: 'Promo code already used by another registrant.',
        status: 409,
      };
    }
  }

  return { ok: true, promoCode: rawPromo };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    const $unset: Record<string, ''> = {};

    const hasTShirt = Object.prototype.hasOwnProperty.call(body, 'tShirtSize');
    const hasProfile =
      Object.prototype.hasOwnProperty.call(body, 'name') ||
      Object.prototype.hasOwnProperty.call(body, 'gender') ||
      Object.prototype.hasOwnProperty.call(body, 'birthday') ||
      Object.prototype.hasOwnProperty.call(body, 'promoCode') ||
      Object.prototype.hasOwnProperty.call(body, 'raceCategory') ||
      Object.prototype.hasOwnProperty.call(body, 'speedDistance');

    if (!hasTShirt && !hasProfile) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if (hasTShirt) {
      const size = body.tShirtSize != null ? String(body.tShirtSize).trim() : '';
      if (size !== '' && !T_SHIRT_SIZES.includes(size)) {
        return NextResponse.json(
          {
            error:
              'Invalid T-shirt size. Use one of: ' + T_SHIRT_SIZES.join(', ') + ', or empty to clear',
          },
          { status: 400 }
        );
      }
      $set.tShirtSize = size;
    }

    if (hasProfile) {
      if (!Object.prototype.hasOwnProperty.call(body, 'name')) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      if (!Object.prototype.hasOwnProperty.call(body, 'gender')) {
        return NextResponse.json({ error: 'Gender is required' }, { status: 400 });
      }
      if (!Object.prototype.hasOwnProperty.call(body, 'birthday')) {
        return NextResponse.json({ error: 'Birthday is required' }, { status: 400 });
      }
      if (!Object.prototype.hasOwnProperty.call(body, 'raceCategory')) {
        return NextResponse.json({ error: 'Race experience category is required' }, { status: 400 });
      }
      if (!Object.prototype.hasOwnProperty.call(body, 'promoCode')) {
        return NextResponse.json({ error: 'Advocate code field is required' }, { status: 400 });
      }

      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }

      const gender = String(body.gender).trim();
      if (!GENDERS.includes(gender as (typeof GENDERS)[number])) {
        return NextResponse.json({ error: 'Gender must be Male or Female' }, { status: 400 });
      }

      const birthday = normalizeBirthdayForStorage(body.birthday);
      if (!birthday) {
        return NextResponse.json({ error: 'Invalid birthday' }, { status: 400 });
      }

      const raceCategory = String(body.raceCategory).trim();
      if (!RACE_CATEGORY_SET.has(raceCategory)) {
        return NextResponse.json({ error: 'Invalid race experience category' }, { status: 400 });
      }

      const spd = body.speedDistance != null ? String(body.speedDistance).trim() : '';
      if (!SPEED_DISTANCES_ALLOWED.has(spd)) {
        return NextResponse.json(
          { error: 'Please select a speed option: 2KM, 5KM, 10KM, or 21KM.' },
          { status: 400 }
        );
      }
      $set.speedDistance = spd;
      $unset.patronSpeedDistance = '';

      const promoResult = await resolvePromoCodeForUpdate(
        body.promoCode != null ? String(body.promoCode) : '',
        raceCategory,
        objectId,
        collection
      );
      if (!promoResult.ok) {
        return NextResponse.json({ error: promoResult.error }, { status: promoResult.status });
      }

      $set.name = name;
      $set.gender = gender;
      $set.birthday = birthday;
      $set.raceCategory = raceCategory;
      $set.promoCode = promoResult.promoCode;
    }

    const updateDoc: Record<string, unknown> = { $set };
    if (Object.keys($unset).length > 0) {
      updateDoc.$unset = $unset;
    }

    await collection.updateOne({ _id: objectId }, updateDoc);

    const updated = await collection.findOne({ _id: objectId });
    const doc = updated as {
      name?: string;
      gender?: string;
      birthday?: string;
      raceCategory?: string;
      speedDistance?: string;
      promoCode?: string;
      tShirtSize?: string;
    };

    return NextResponse.json(
      {
        success: true,
        name: doc.name ?? '',
        gender: doc.gender ?? '',
        birthday: doc.birthday ?? '',
        raceCategory: doc.raceCategory ?? '',
        speedDistance: getStoredSpeedDistance(doc),
        promoCode: doc.promoCode ?? '',
        tShirtSize: doc.tShirtSize ?? '',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update registrant' }, { status: 500 });
  }
}
