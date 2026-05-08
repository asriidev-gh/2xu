import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface EmailBlastDoc {
  messageHtml: string;
  messageText: string;
  mode?: 'blast' | 'test';
  testRecipients?: string[];
  recipientCount: number;
  successCount: number;
  failedCount: number;
  status: 'sent' | 'partial' | 'failed';
  createdAt: Date;
  sentAt: Date;
}

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

function buildTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !port || !user || !pass) {
    return null;
  }

  const portNum = parseInt(port, 10);
  return nodemailer.createTransport({
    host,
    port: portNum,
    secure: portNum === 465,
    auth: { user, pass },
  });
}

const ccRecipients = [
  'oneofakindasiaph@gmail.com',
  'ops@oneofakindasia.com',
  '1@oneofakindasia.com',
];

function normalizeEmailList(raw: string): string[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seen = new Set<string>();

  return raw
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((email) => emailRegex.test(email))
    .filter((email) => {
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection<EmailBlastDoc>('email_blasts');

    const blasts = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = blasts.map((blast) => ({
      _id: String(blast._id),
      messageHtml: blast.messageHtml,
      messageText: blast.messageText,
      recipientCount: blast.recipientCount ?? 0,
      successCount: blast.successCount ?? 0,
      failedCount: blast.failedCount ?? 0,
      status: blast.status ?? 'failed',
      createdAt: blast.createdAt ? new Date(blast.createdAt).toISOString() : null,
      sentAt: blast.sentAt ? new Date(blast.sentAt).toISOString() : null,
    }));

    return NextResponse.json({ blasts: formatted }, { status: 200 });
  } catch (error) {
    console.error('Fetch email blasts error:', error);
    return NextResponse.json({ error: 'Failed to fetch email blasts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const messageHtmlRaw = typeof body?.messageHtml === 'string' ? body.messageHtml : '';
    const messageHtml = messageHtmlRaw.trim();
    const messageText = stripHtmlTags(messageHtml);
    const isTestMode = Boolean(body?.isTestMode);
    const testEmailsRaw = typeof body?.testEmails === 'string' ? body.testEmails : '';

    if (!messageHtml || !messageText) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const transporter = buildTransporter();
    if (!transporter) {
      return NextResponse.json({ error: 'SMTP is not configured' }, { status: 500 });
    }

    const from = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';
    const subject = process.env.EMAIL_BLAST_SUBJECT?.trim() || '2XU Speed Series Announcement';

    const client = await clientPromise;
    const db = client.db('2xu');
    const usersCollection = db.collection('users');
    const blastsCollection = db.collection<EmailBlastDoc>('email_blasts');

    let recipientEmails: string[] = [];
    if (isTestMode) {
      recipientEmails = normalizeEmailList(testEmailsRaw);
      if (recipientEmails.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one valid test email address.' },
          { status: 400 }
        );
      }
    } else {
      const recipientDocs = await usersCollection
        .aggregate<{ email: string }>([
          { $match: { email: { $type: 'string', $ne: '' } } },
          { $group: { _id: { $toLower: '$email' }, email: { $first: '$email' } } },
        ])
        .toArray();

      recipientEmails = recipientDocs
        .map((doc) => doc.email?.trim())
        .filter((email): email is string => Boolean(email));
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No users found with valid email addresses' }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;

    const chunkSize = 50;
    for (let i = 0; i < recipientEmails.length; i += chunkSize) {
      const chunk = recipientEmails.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map((to) =>
          transporter.sendMail({
            from,
            to,
            cc: ccRecipients,
            subject,
            html: messageHtml,
            text: messageText,
          })
        )
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount += 1;
        } else {
          failedCount += 1;
          console.error('[Email Blast] Failed recipient send:', result.reason);
        }
      }
    }

    const now = new Date();
    const status: EmailBlastDoc['status'] =
      successCount === 0 ? 'failed' : failedCount > 0 ? 'partial' : 'sent';

    const savedBlast: EmailBlastDoc = {
      messageHtml,
      messageText,
      mode: isTestMode ? 'test' : 'blast',
      testRecipients: isTestMode ? recipientEmails : [],
      recipientCount: recipientEmails.length,
      successCount,
      failedCount,
      status,
      createdAt: now,
      sentAt: now,
    };

    const insertResult = await blastsCollection.insertOne(savedBlast);

    return NextResponse.json(
      {
        success: true,
        blast: {
          _id: String(insertResult.insertedId),
          ...savedBlast,
          createdAt: savedBlast.createdAt.toISOString(),
          sentAt: savedBlast.sentAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create email blast error:', error);
    return NextResponse.json({ error: 'Failed to send email blast' }, { status: 500 });
  }
}
