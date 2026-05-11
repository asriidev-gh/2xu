import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

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

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name') || '';
    const email = searchParams.get('email') || '';
    const gender = searchParams.get('gender') || '';
    const raceCategory = searchParams.get('raceCategory') || '';
    const club = searchParams.get('club') || '';
    const promoCode = searchParams.get('promoCode') || '';
    const emailStatus = searchParams.get('emailStatus') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
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

    // Build filter query
    const filter: any = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (gender) {
      filter.gender = gender;
    }

    if (raceCategory) {
      filter.raceCategory = raceCategory;
    }

    if (club) {
      // Exact match (filter value comes from distinct-affiliations dropdown)
      filter.affiliations = club;
    }

    if (promoCode) {
      filter.promoCode = { $regex: promoCode.trim(), $options: 'i' };
    }

    if (emailStatus && ['success', 'failed', 'pending'].includes(emailStatus)) {
      if (emailStatus === 'pending') {
        // Legacy users may not have mailerStatus persisted yet; treat them as pending.
        filter.$or = [
          { mailerStatus: 'pending' },
          { mailerStatus: { $exists: false } },
          { mailerStatus: null },
          { mailerStatus: '' },
        ];
      } else {
        filter.mailerStatus = emailStatus;
      }
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Get total count and paginated users
    const total = await collection.countDocuments(filter);
    const users = await collection
      .find(filter)
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

