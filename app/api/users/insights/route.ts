import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import {
  getUtcThisMonthSoFarBounds,
  getUtcThisWeekSoFarBounds,
  getUtcTodayBounds,
} from '@/lib/insightsPeriodBounds';
import { mergeAffiliationCounts } from '@/lib/affiliationKey';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

type CountRow = { _id: string; count: number };

function fillLastNDailyCounts(
  days: number,
  rows: { date: string; count: number }[]
): { date: string; count: number; label: string }[] {
  const byDate = new Map(rows.map((r) => [r.date, r.count]));
  const out: { date: string; count: number; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      date: iso,
      count: byDate.get(iso) ?? 0,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const users = db.collection('users');

    const totalRegistered = await users.countDocuments({});

    const raceRows = (await users
      .aggregate<CountRow>([
        {
          $group: {
            _id: { $ifNull: ['$raceCategory', 'Unknown'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()) as CountRow[];

    const genderRows = (await users
      .aggregate<CountRow>([
        {
          $group: {
            _id: {
              $cond: [
                { $in: ['$gender', ['Male', 'Female']] },
                '$gender',
                'Other / not set',
              ],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()) as CountRow[];

    const mailerRowsRaw = await users
      .aggregate<{ _id: string; count: number }>([
        {
          $project: {
            status: {
              $switch: {
                branches: [
                  { case: { $eq: ['$mailerStatus', 'failed'] }, then: 'failed' },
                  { case: { $eq: ['$mailerStatus', 'success'] }, then: 'success' },
                ],
                default: 'pending',
              },
            },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray();

    const mailerMap = Object.fromEntries(mailerRowsRaw.map((r) => [r._id, r.count])) as Record<
      string,
      number
    >;
    const byEmailStatus = {
      success: mailerMap.success ?? 0,
      failed: mailerMap.failed ?? 0,
      pending: mailerMap.pending ?? 0,
    };

    const withPromoCode = await users.countDocuments({
      promoCode: { $type: 'string', $regex: /\S/ },
    });

    const teamIds = await users.distinct('teamId', {
      teamId: { $exists: true, $ne: null },
    });
    const distinctGroupRegistrations = teamIds.filter(Boolean).length;

    const soloOrNonTeamRows = await users.countDocuments({
      $or: [{ teamId: { $exists: false } }, { teamId: null }],
    });

    const start14 = new Date();
    start14.setDate(start14.getDate() - 13);
    start14.setHours(0, 0, 0, 0);

    const dailyAgg = await users
      .aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: start14 } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const registrationsByDay = fillLastNDailyCounts(
      14,
      dailyAgg.map((r) => ({ date: r._id, count: r.count }))
    );

    const topClubRows = (await users
      .aggregate<{ _id: string; count: number }>([
        { $match: { affiliations: { $type: 'string', $regex: /\S/ } } },
        { $group: { _id: '$affiliations', count: { $sum: 1 } } },
      ])
      .toArray()) as { _id: string; count: number }[];

    const topClubs = mergeAffiliationCounts(
      topClubRows.map((row) => ({ raw: String(row._id), count: row.count }))
    ).slice(0, 10);

    const byDeviceType = (await users
      .aggregate<{ _id: string; count: number }>([
        {
          $addFields: {
            deviceBucket: {
              $switch: {
                branches: [
                  { case: { $eq: ['$signupContext.deviceType', 'mobile'] }, then: 'Mobile' },
                  { case: { $eq: ['$signupContext.deviceType', 'tablet'] }, then: 'Tablet' },
                  { case: { $eq: ['$signupContext.deviceType', 'desktop'] }, then: 'Desktop' },
                ],
                default: 'Unknown',
              },
            },
          },
        },
        { $group: { _id: '$deviceBucket', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray()) as { _id: string; count: number }[];

    const byLocation = (await users
      .aggregate<{ _id: string; count: number }>([
        {
          $addFields: {
            locationBucket: {
              $let: {
                vars: {
                  label: {
                    $trim: {
                      input: { $ifNull: ['$signupContext.locationLabel', ''] },
                    },
                  },
                },
                in: {
                  $cond: [{ $gt: [{ $strLenCP: '$$label' }, 0] }, '$$label', 'Unknown'],
                },
              },
            },
          },
        },
        { $group: { _id: '$locationBucket', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray()) as { _id: string; count: number }[];

    const promotionalOptIn = await users.countDocuments({ promotional: true });

    const now = new Date();
    const { start: todayStart, end: todayEnd } = getUtcTodayBounds(now);
    const { start: weekStart, end: weekEnd } = getUtcThisWeekSoFarBounds(now);
    const { start: monthStart, end: monthEnd } = getUtcThisMonthSoFarBounds(now);

    const filterToday = { createdAt: { $gte: todayStart, $lte: todayEnd } };
    const filterWeek = { createdAt: { $gte: weekStart, $lte: weekEnd } };
    const filterMonth = { createdAt: { $gte: monthStart, $lte: monthEnd } };

    const [registrationsToday, registrationsThisWeek, registrationsThisMonth] = await Promise.all([
      users.countDocuments(filterToday),
      users.countDocuments(filterWeek),
      users.countDocuments(filterMonth),
    ]);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        registrationsToday,
        registrationsThisWeek,
        registrationsThisMonth,
        totalRegistered,
        soloRows: soloOrNonTeamRows,
        distinctGroupRegistrations,
        withPromoCode,
        promotionalOptIn,
        byRaceCategory: raceRows.map((r) => ({
          name: String(r._id || 'Unknown'),
          count: r.count,
        })),
        byGender: genderRows.map((r) => ({
          name: String(r._id || 'Unknown'),
          count: r.count,
        })),
        registrationsByDay,
        topClubs,
        byDeviceType: byDeviceType.map((row) => ({
          name: String(row._id || 'Unknown'),
          count: row.count,
        })),
        byLocation: byLocation.map((row) => ({
          name: String(row._id || 'Unknown'),
          count: row.count,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}
