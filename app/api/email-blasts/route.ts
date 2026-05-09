import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface EmailBlastDoc {
  messageHtml: string;
  messageText: string;
  mode?: 'blast' | 'test';
  retrySourceBlastId?: string;
  ccRecipients?: string[];
  testRecipients?: string[];
  successfulRecipients?: BlastRecipientRow[];
  failedRecipients?: BlastRecipientRow[];
  recipientCount: number;
  successCount: number;
  failedCount: number;
  status: 'sent' | 'partial' | 'failed';
  createdAt: Date;
  sentAt: Date;
}

type BlastRecipientRow = { email: string; name: string };

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

function isEmailBlastEnabled() {
  return process.env.EMAIL_BLAST_ENABLED === 'true';
}

function isEmailBlastTestEnabled() {
  return process.env.EMAIL_BLAST_TEST_ENABLED === 'true';
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

function buildResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const ccRecipients = [
  'oneofakindasiaph@gmail.com',
  // 'ops@oneofakindasia.com',
  // '1@oneofakindasia.com',
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isResendRateLimitError(error: unknown): boolean {
  const e = error as { statusCode?: number; name?: string; message?: string };
  const name = String(e?.name || '').toLowerCase();
  const msg = String(e?.message || '').toLowerCase();
  return e?.statusCode === 429 || name.includes('rate_limit') || msg.includes('too many requests');
}

async function sendViaResendWithRetry(params: {
  resend: Resend;
  from: string;
  to: string;
  cc: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const { resend, from, to, cc, subject, html, text } = params;
  const maxAttempts = 3;
  let delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await resend.emails.send({
      from,
      to: [to],
      cc,
      subject,
      html,
      text,
    });
    if (!result.error) return;

    if (attempt < maxAttempts && isResendRateLimitError(result.error)) {
      await sleep(delayMs);
      delayMs *= 2;
      continue;
    }
    throw result.error;
  }
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isEmailBlastEnabled()) {
      return NextResponse.json({ error: 'Email blast is disabled' }, { status: 403 });
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
      mode: blast.mode ?? 'blast',
      ccRecipients: blast.ccRecipients ?? [],
      testRecipients: blast.testRecipients ?? [],
      successfulRecipients: blast.successfulRecipients ?? [],
      failedRecipients: blast.failedRecipients ?? [],
      recipientCount: blast.recipientCount ?? 0,
      successCount: blast.successCount ?? 0,
      failedCount: blast.failedCount ?? 0,
      status: blast.status ?? 'failed',
      createdAt: blast.createdAt ? new Date(blast.createdAt).toISOString() : null,
      sentAt: blast.sentAt ? new Date(blast.sentAt).toISOString() : null,
    }));

    return NextResponse.json(
      {
        blasts: formatted,
        emailBlastDeleteEnabled: process.env.EMAIL_BLAST_DELETE_ENABLED === 'true',
        emailBlastTestEnabled: isEmailBlastTestEnabled(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch email blasts error:', error);
    return NextResponse.json({ error: 'Failed to fetch email blasts' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isEmailBlastEnabled()) {
      return NextResponse.json({ error: 'Email blast is disabled' }, { status: 403 });
    }
    if (process.env.EMAIL_BLAST_DELETE_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Email blast delete is disabled in this environment' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const blastId = typeof body?.blastId === 'string' ? body.blastId.trim() : '';
    if (!blastId || !ObjectId.isValid(blastId)) {
      return NextResponse.json({ error: 'Invalid blast id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const blastsCollection = db.collection<EmailBlastDoc>('email_blasts');
    const result = await blastsCollection.deleteOne({ _id: new ObjectId(blastId) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Email blast not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete email blast error:', error);
    return NextResponse.json({ error: 'Failed to delete email blast' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isEmailBlastEnabled()) {
      return NextResponse.json({ error: 'Email blast is disabled' }, { status: 403 });
    }

    const body = await request.json();
    const retryFromBlastId =
      typeof body?.retryFromBlastId === 'string' ? body.retryFromBlastId.trim() : '';
    const messageHtmlRaw = typeof body?.messageHtml === 'string' ? body.messageHtml : '';
    let messageHtml = messageHtmlRaw.trim();
    let messageText = stripHtmlTags(messageHtml);
    let isTestMode = Boolean(body?.isTestMode);
    const testEmailsRaw = typeof body?.testEmails === 'string' ? body.testEmails : '';
    const customCcRaw = typeof body?.ccEmails === 'string' ? body.ccEmails : '';
    const customCcRecipients = normalizeEmailList(customCcRaw);
    if (customCcRaw.trim() && customCcRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one valid CC email address.' },
        { status: 400 }
      );
    }
    const mergedCcRecipients = Array.from(
      new Set([
        ...ccRecipients.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean),
        ...customCcRecipients,
      ])
    );
    let effectiveCcRecipients = mergedCcRecipients;
    const emailBlastTestEnabled = isEmailBlastTestEnabled();
    if (isTestMode && !emailBlastTestEnabled) {
      return NextResponse.json(
        { error: 'Email blast test mode is disabled in this environment' },
        { status: 403 }
      );
    }

    const from = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';
    const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || from;
    const subject = process.env.EMAIL_BLAST_SUBJECT?.trim() || '2XU Speed Series Announcement';

    const client = await clientPromise;
    const db = client.db('2xu');
    const usersCollection = db.collection('users');
    const blastsCollection = db.collection<EmailBlastDoc>('email_blasts');

    let recipients: BlastRecipientRow[] = [];
    if (retryFromBlastId) {
      if (!ObjectId.isValid(retryFromBlastId)) {
        return NextResponse.json({ error: 'Invalid blast id' }, { status: 400 });
      }
      const sourceBlast = await blastsCollection.findOne({ _id: new ObjectId(retryFromBlastId) });
      if (!sourceBlast) {
        return NextResponse.json({ error: 'Original blast not found' }, { status: 404 });
      }
      messageHtml = String(sourceBlast.messageHtml || '').trim();
      messageText = stripHtmlTags(messageHtml);
      recipients = (sourceBlast.failedRecipients ?? [])
        .map((row) => ({
          email: String(row?.email || '').trim().toLowerCase(),
          name: String(row?.name || '').trim(),
        }))
        .filter((row) => Boolean(row.email));
      if (!customCcRaw.trim()) {
        const sourceCc = Array.isArray(sourceBlast.ccRecipients)
          ? sourceBlast.ccRecipients.map((email) => String(email || '').trim().toLowerCase())
          : [];
        effectiveCcRecipients = Array.from(
          new Set([
            ...ccRecipients.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean),
            ...sourceCc.filter(Boolean),
          ])
        );
      }
      isTestMode = false;
    } else if (isTestMode) {
      const testEmails = normalizeEmailList(testEmailsRaw);
      if (testEmails.length === 0) {
        return NextResponse.json(
          { error: 'Please provide at least one valid test email address.' },
          { status: 400 }
        );
      }
      const knownTestRecipients = await usersCollection
        .aggregate<{ email: string; name: string }>([
          { $match: { email: { $type: 'string', $ne: '' } } },
          {
            $project: {
              normalizedEmail: { $toLower: { $trim: { input: '$email' } } },
              name: { $trim: { input: { $toString: { $ifNull: ['$name', ''] } } } },
            },
          },
          { $match: { normalizedEmail: { $in: testEmails } } },
          { $group: { _id: '$normalizedEmail', name: { $first: '$name' } } },
          { $project: { _id: 0, email: '$_id', name: 1 } },
        ])
        .toArray();
      const nameByEmail = new Map(
        knownTestRecipients.map((row) => [String(row.email || '').toLowerCase(), String(row.name || '')])
      );
      recipients = testEmails.map((email) => ({
        email,
        name: nameByEmail.get(email.toLowerCase()) || '',
      }));
    } else {
      const recipientDocs = await usersCollection
        .aggregate<{ email: string; name: string }>([
          { $match: { email: { $type: 'string', $ne: '' } } },
          {
            $project: {
              normalizedEmail: { $toLower: { $trim: { input: '$email' } } },
              name: { $trim: { input: { $toString: { $ifNull: ['$name', ''] } } } },
            },
          },
          { $match: { normalizedEmail: { $ne: '' } } },
          { $group: { _id: '$normalizedEmail', name: { $first: '$name' } } },
          { $project: { _id: 0, email: '$_id', name: 1 } },
        ])
        .toArray();

      recipients = recipientDocs
        .map((doc) => ({
          email: String(doc.email || '').trim().toLowerCase(),
          name: String(doc.name || '').trim(),
        }))
        .filter((row) => Boolean(row.email));
    }

    if (!messageHtml || !messageText) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const recipientEmails = recipients.map((row) => row.email);
    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No users found with valid email addresses' }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;
    const successfulRecipients: BlastRecipientRow[] = [];
    const failedRecipients: BlastRecipientRow[] = [];

    const resend = buildResend();
    const transporter = resend ? null : buildTransporter();
    if (!resend && !transporter) {
      return NextResponse.json(
        { error: 'Neither Resend nor SMTP is configured for email blast delivery' },
        { status: 500 }
      );
    }

    // Resend free-tier limit is 2 requests/sec. Send sequentially with delay to avoid 429s.
    const minIntervalMs = resend ? 550 : 0;
    for (let i = 0; i < recipients.length; i += 1) {
      const row = recipients[i];
      try {
        if (resend) {
          await sendViaResendWithRetry({
            resend,
            from: resendFrom,
            to: row.email,
            cc: effectiveCcRecipients,
            subject,
            html: messageHtml,
            text: messageText,
          });
        } else {
          await transporter!.sendMail({
            from,
            to: row.email,
            cc: effectiveCcRecipients,
            subject,
            html: messageHtml,
            text: messageText,
          });
        }

        successCount += 1;
        successfulRecipients.push({ email: row.email, name: row.name });
      } catch (error) {
        failedCount += 1;
        failedRecipients.push({ email: row.email, name: row.name });
        console.error('[Email Blast] Failed recipient send:', error);
      }

      if (minIntervalMs > 0 && i < recipients.length - 1) {
        await sleep(minIntervalMs);
      }
    }

    const now = new Date();
    const status: EmailBlastDoc['status'] =
      successCount === 0 ? 'failed' : failedCount > 0 ? 'partial' : 'sent';

    const savedBlast: EmailBlastDoc = {
      messageHtml,
      messageText,
      mode: retryFromBlastId ? 'blast' : isTestMode ? 'test' : 'blast',
      retrySourceBlastId: retryFromBlastId || undefined,
      ccRecipients: effectiveCcRecipients,
      testRecipients: isTestMode ? recipientEmails : [],
      successfulRecipients,
      failedRecipients,
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
