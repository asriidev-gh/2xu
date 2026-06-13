import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { sendRegistrationConfirmation } from '@/lib/sendConfirmationEmail';
import { getStoredSpeedDistance } from '@/lib/raceCategories';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function POST(
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
    const users = db.collection('users');

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const toEmail = String(user.email || '').trim();
    const name = String(user.name || '').trim();
    if (!toEmail || !name) {
      return NextResponse.json(
        { error: 'User record is missing required email/name' },
        { status: 400 }
      );
    }

    const promoCode = String((user as { promoCode?: string }).promoCode || '').trim();
    const raceCategory = String((user as { raceCategory?: string }).raceCategory || '').trim();
    const speedDistance = getStoredSpeedDistance(
      user as { speedDistance?: string; patronSpeedDistance?: string }
    );
    const paymentProofSent =
      (user as { paymentProofSent?: boolean }).paymentProofSent === true;
    const bibNumber = String((user as { bibNumber?: string }).bibNumber || '').trim();

    const paymentProofUrl = String((user as { paymentProofUrl?: string }).paymentProofUrl || '').trim();

    const mailResult = await sendRegistrationConfirmation(name, toEmail, {
      promoCode,
      raceCategory,
      speedDistance,
      paymentProofSent,
      paymentProofUrl,
      orderNumber: String(user._id),
      bibNumber,
    });

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          mailerStatus: mailResult.success ? 'success' : 'failed',
          mailerLastAttemptAt: new Date(),
          mailerLastError: mailResult.success ? null : mailResult.error,
          mailerEmailPreview: {
            subject: mailResult.preview.subject,
            html: mailResult.preview.html,
            text: mailResult.preview.text,
            capturedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: mailResult.success,
        mailerStatus: mailResult.success ? 'success' : 'failed',
        mailerLastError: mailResult.success ? null : mailResult.error,
      },
      { status: mailResult.success ? 200 : 502 }
    );
  } catch (error) {
    console.error('Retry registration mailer error:', error);
    return NextResponse.json(
      { error: 'Failed to retry registration email' },
      { status: 500 }
    );
  }
}
