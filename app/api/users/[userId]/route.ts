import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await _request.json();
    const { tShirtSize } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const size = tShirtSize != null ? String(tShirtSize).trim() : '';
    if (size !== '' && !T_SHIRT_SIZES.includes(size)) {
      return NextResponse.json(
        { error: 'Invalid T-shirt size. Use one of: ' + T_SHIRT_SIZES.join(', ') + ', or empty to clear' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { tShirtSize: size, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, tShirtSize: size },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user T-shirt size error:', error);
    return NextResponse.json(
      { error: 'Failed to update T-shirt size' },
      { status: 500 }
    );
  }
}
