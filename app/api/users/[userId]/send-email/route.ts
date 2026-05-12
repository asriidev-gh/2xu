import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatSendError(err: unknown): string {
  const e = err as { message?: string; name?: string };
  const msg = typeof e?.message === 'string' ? e.message : String(err);
  const name = typeof e?.name === 'string' ? e.name : '';
  return [name || null, msg || null].filter(Boolean).join(' | ').slice(0, 400) || 'Failed to send email';
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json().catch(() => ({}));
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const messageHtml = typeof body.messageHtml === 'string' ? body.messageHtml.trim() : '';

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const messageText = stripHtmlTags(messageHtml);
    if (!messageText) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const toEmail = String(user.email || '').trim();
    const name = String(user.name || '').trim();
    if (!toEmail) {
      return NextResponse.json({ error: 'User record is missing an email address' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const smtpFrom = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';
    const from = process.env.RESEND_FROM_EMAIL?.trim() || smtpFrom;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const { error } = await resend.emails.send({
        from,
        to: [toEmail],
        subject,
        html: messageHtml,
        text: messageText,
      });
      if (error) {
        return NextResponse.json(
          { error: formatSendError(error) },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          recipientEmail: toEmail,
          recipientName: name,
        },
        { status: 200 }
      );
    }

    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    if (!host || !port || !smtpUser || !pass) {
      return NextResponse.json(
        { error: 'Neither Resend nor SMTP is configured for outbound email' },
        { status: 500 }
      );
    }

    const portNum = parseInt(port, 10);
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: portNum === 465,
      auth: { user: smtpUser, pass },
    });

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        html: messageHtml,
        text: messageText,
      });
    } catch (err) {
      return NextResponse.json({ error: formatSendError(err) }, { status: 502 });
    }

    return NextResponse.json(
      {
        success: true,
        recipientEmail: toEmail,
        recipientName: name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send registrant email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
