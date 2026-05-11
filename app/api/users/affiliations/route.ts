import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

/** Distinct non-empty affiliations across all users (not paginated). */
export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    const rows = await collection
      .aggregate<{ _id: string }>([
        {
          $match: {
            affiliations: { $type: 'string', $nin: ['', null] },
          },
        },
        { $group: { _id: '$affiliations' } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const affiliations = rows.map((r) => String(r._id ?? '')).filter((v) => v.length > 0);

    return NextResponse.json({ affiliations }, { status: 200 });
  } catch (error) {
    console.error('Fetch affiliations error:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliations' }, { status: 500 });
  }
}
