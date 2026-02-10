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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name') || '';
    const email = searchParams.get('email') || '';
    const gender = searchParams.get('gender') || '';
    const raceCategory = searchParams.get('raceCategory') || '';
    const club = searchParams.get('club') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

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
      filter.affiliations = { $regex: club, $options: 'i' };
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

    // Fetch users with filters
    const users = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Format dates for response
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      contact: user.contact,
      gender: user.gender,
      birthday: user.birthday,
      raceCategory: (user as { raceCategory?: string }).raceCategory || '',
      affiliations: user.affiliations || '',
      promotional: user.promotional || false,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null
    }));

    return NextResponse.json(
      { users: formattedUsers, count: formattedUsers.length },
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

