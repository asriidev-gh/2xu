import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

function formatPreview(user: Record<string, unknown>) {
  const preview = user.mailerEmailPreview as
    | {
        subject?: string;
        html?: string;
        text?: string;
        capturedAt?: Date | string;
      }
    | undefined;
  const capturedAt = preview?.capturedAt
    ? new Date(preview.capturedAt).toISOString()
    : null;

  return {
    subject: typeof preview?.subject === 'string' ? preview.subject : '',
    html: typeof preview?.html === 'string' ? preview.html : '',
    text: typeof preview?.text === 'string' ? preview.text : '',
    capturedAt,
    mailerStatus:
      (user.mailerStatus as 'success' | 'failed' | 'pending' | undefined) || 'pending',
    mailerLastAttemptAt: user.mailerLastAttemptAt
      ? new Date(user.mailerLastAttemptAt as Date | string).toISOString()
      : null,
    mailerLastError:
      typeof user.mailerLastError === 'string' ? user.mailerLastError : null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          name: 1,
          email: 1,
          mailerStatus: 1,
          mailerLastAttemptAt: 1,
          mailerLastError: 1,
          mailerEmailPreview: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        userId,
        name: String(user.name || ''),
        email: String(user.email || ''),
        preview: formatPreview(user as Record<string, unknown>),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch mailer preview error:', error);
    return NextResponse.json({ error: 'Failed to load email preview' }, { status: 500 });
  }
}
