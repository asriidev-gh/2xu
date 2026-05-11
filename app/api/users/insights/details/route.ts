import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import {
  getUtcThisMonthSoFarBounds,
  getUtcThisWeekSoFarBounds,
  getUtcTodayBounds,
} from '@/lib/insightsPeriodBounds';

export const dynamic = 'force-dynamic';

const ALLOWED_METRICS = new Set([
  'all',
  'solo',
  'team_member',
  'group_leads',
  'with_promo',
  'promotional',
  'race',
  'gender',
  'day',
  'club',
  'period_today',
  'period_week',
  'period_month',
]);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

const DETAIL_SORT_FIELDS = new Set([
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
  'teamMemberIndex',
  'createdAt',
]);

function parseMongoSort(searchParams: URLSearchParams): Record<string, 1 | -1> {
  const rawBy = (searchParams.get('sortBy') || 'createdAt').trim();
  const rawDir = (searchParams.get('sortDir') || 'desc').trim().toLowerCase();
  const sortBy = DETAIL_SORT_FIELDS.has(rawBy) ? rawBy : 'createdAt';
  const sortDir = rawDir === 'asc' || rawDir === 'desc' ? rawDir : 'desc';
  const order = sortDir === 'asc' ? 1 : -1;
  return { [sortBy]: order };
}

function buildFilter(metric: string, value: string): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  switch (metric) {
    case 'all':
      break;
    case 'solo':
      filter.$or = [{ teamId: { $exists: false } }, { teamId: null }];
      break;
    case 'team_member':
      filter.teamId = { $exists: true, $ne: null };
      break;
    case 'with_promo':
      filter.promoCode = { $type: 'string', $regex: /\S/ };
      break;
    case 'promotional':
      filter.promotional = true;
      break;
    case 'race':
      if (!value) throw new Error('Missing value for race');
      if (value === 'Unknown') {
        filter.$or = [
          { raceCategory: { $exists: false } },
          { raceCategory: null },
          { raceCategory: '' },
          { raceCategory: 'Unknown' },
        ];
      } else {
        filter.raceCategory = value;
      }
      break;
    case 'gender':
      if (!value) throw new Error('Missing value for gender');
      if (value === '__OTHER__') {
        filter.$nor = [{ gender: 'Male' }, { gender: 'Female' }];
      } else {
        filter.gender = value;
      }
      break;
    case 'day': {
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid day');
      const start = new Date(`${value}T00:00:00.000Z`);
      const end = new Date(`${value}T23:59:59.999Z`);
      filter.createdAt = { $gte: start, $lte: end };
      break;
    }
    case 'club':
      if (!value) throw new Error('Missing value for club');
      filter.affiliations = value;
      break;
    case 'period_today': {
      const { start, end } = getUtcTodayBounds();
      filter.createdAt = { $gte: start, $lte: end };
      break;
    }
    case 'period_week': {
      const { start, end } = getUtcThisWeekSoFarBounds();
      filter.createdAt = { $gte: start, $lte: end };
      break;
    }
    case 'period_month': {
      const { start, end } = getUtcThisMonthSoFarBounds();
      filter.createdAt = { $gte: start, $lte: end };
      break;
    }
    default:
      throw new Error('Invalid metric');
  }

  return filter;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const metric = (searchParams.get('metric') || '').trim();
    const value = searchParams.get('value') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

    if (!ALLOWED_METRICS.has(metric)) {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    const mongoSort = parseMongoSort(request.nextUrl.searchParams);

    if (metric === 'group_leads') {
      const pipeline: Record<string, unknown>[] = [
        { $match: { teamId: { $exists: true, $ne: null } } },
        { $sort: { teamMemberIndex: 1 } },
        {
          $group: {
            _id: '$teamId',
            doc: { $first: '$$ROOT' },
          },
        },
        { $replaceWith: '$doc' },
        { $sort: mongoSort },
        {
          $facet: {
            total: [{ $count: 'n' }],
            rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          },
        },
      ];

      const agg = await collection.aggregate(pipeline).toArray();
      const facet = agg[0] as { total: { n: number }[]; rows: Record<string, unknown>[] };
      const total = facet.total[0]?.n ?? 0;
      const users = facet.rows.map(formatUserDoc);
      const totalPages = Math.ceil(total / limit) || 1;

      return NextResponse.json(
        {
          users,
          total,
          page,
          limit,
          totalPages,
          metric,
        },
        { status: 200 }
      );
    }

    let filter: Record<string, unknown>;
    try {
      filter = buildFilter(metric, value);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid parameters' },
        { status: 400 }
      );
    }

    const total = await collection.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;
    const rows = await collection
      .find(filter)
      .sort(mongoSort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const users = rows.map(formatUserDoc);

    return NextResponse.json(
      {
        users,
        total,
        page,
        limit,
        totalPages,
        metric,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Insights details error:', error);
    return NextResponse.json({ error: 'Failed to load details' }, { status: 500 });
  }
}

function formatUserDoc(user: Record<string, unknown>) {
  const createdAt = user.createdAt ? new Date(user.createdAt as Date).toISOString() : null;
  return {
    _id: String(user._id),
    name: user.name ?? '',
    email: user.email ?? '',
    contact: user.contact ?? '',
    gender: user.gender ?? '',
    birthday: user.birthday ?? '',
    raceCategory: (user.raceCategory as string) || '',
    tShirtSize: (user.tShirtSize as string) || '',
    affiliations: user.affiliations ?? '',
    promotional: Boolean(user.promotional),
    promoCode: (user.promoCode as string) || '',
    teamMemberIndex: user.teamMemberIndex as number | undefined,
    createdAt,
  };
}
