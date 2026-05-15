import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { buildRegistrantsListMongoFilterFromSearchParams } from '@/lib/buildRegistrantsListMongoFilter';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.REGISTRANTS_EXPORT_ALL_EMAILS_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Not enabled' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const listFilter = buildRegistrantsListMongoFilterFromSearchParams(searchParams);

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    const raw = await collection.distinct('email', listFilter);
    const emails = (raw as unknown[])
      .map((e) => (e != null ? String(e).trim() : ''))
      .filter((e) => e.length > 0);
    emails.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const commaSeparated = emails.join(',');

    return NextResponse.json(
      {
        commaSeparated,
        count: emails.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Export registrant emails error:', error);
    return NextResponse.json({ error: 'Failed to load emails' }, { status: 500 });
  }
}
