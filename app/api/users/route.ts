import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { formatSignupContextView } from '@/lib/registrationContext';
import { buildRegistrantsListMongoFilterFromSearchParams } from '@/lib/buildRegistrantsListMongoFilter';

export const dynamic = 'force-dynamic';

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const SORT_FIELDS = new Set([
      'name',
      'email',
      'contact',
      'gender',
      'birthday',
      'raceCategory',
      'tShirtSize',
      'affiliations',
      'promoCode',
      'promotional',
      'mailerStatus',
      'createdAt',
    ]);
    const sortByRaw = (searchParams.get('sortBy') || 'createdAt').trim();
    const sortDirRaw = (searchParams.get('sortDir') || 'desc').trim().toLowerCase();
    const sortBy = SORT_FIELDS.has(sortByRaw) ? sortByRaw : 'createdAt';
    const sortDir = sortDirRaw === 'asc' || sortDirRaw === 'desc' ? sortDirRaw : 'desc';
    const sortOrder = sortDir === 'asc' ? 1 : -1;
    const mongoSort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    // Backfill legacy records that predate mailer tracking.
    await collection.updateMany(
      {
        $or: [
          { mailerStatus: { $exists: false } },
          { mailerStatus: null },
          { mailerStatus: '' },
        ],
      },
      {
        $set: {
          mailerStatus: 'success',
          mailerLastAttemptAt: null,
          mailerLastError: null,
          updatedAt: new Date(),
        },
      }
    );

    const listFilter = buildRegistrantsListMongoFilterFromSearchParams(searchParams);

    // Get total count and paginated users
    const total = await collection.countDocuments(listFilter);
    const users = await collection
      .find(listFilter)
      .sort(mongoSort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(total / limit) || 1;

    // Format dates for response
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      contact: user.contact,
      gender: user.gender,
      birthday: user.birthday,
      raceCategory: (user as { raceCategory?: string }).raceCategory || '',
      patronSpeedDistance: (user as { patronSpeedDistance?: string }).patronSpeedDistance || '',
      tShirtSize: (user as { tShirtSize?: string }).tShirtSize || '',
      affiliations: user.affiliations || '',
      promotional: user.promotional || false,
      promoCode: (user as { promoCode?: string }).promoCode || '',
      mailerStatus:
        (user as { mailerStatus?: 'success' | 'failed' | 'pending' }).mailerStatus || 'pending',
      mailerLastAttemptAt: (user as { mailerLastAttemptAt?: Date | string | null }).mailerLastAttemptAt
        ? new Date((user as { mailerLastAttemptAt?: Date | string | null }).mailerLastAttemptAt as Date | string).toISOString()
        : null,
      mailerLastError: (user as { mailerLastError?: string | null }).mailerLastError || null,
      teamId: (user as { teamId?: string }).teamId?.toString(),
      teamMemberIndex: (user as { teamMemberIndex?: number }).teamMemberIndex,
      signupContext: formatSignupContextView((user as { signupContext?: unknown }).signupContext),
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null
    }));

    return NextResponse.json(
      {
        users: formattedUsers,
        count: formattedUsers.length,
        total,
        page,
        limit,
        totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

