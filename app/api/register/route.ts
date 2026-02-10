import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, contact, gender, birthday, raceCategory, affiliations, promotional } = body;

    // Validate required fields
    if (!name || !email || !contact || !gender || !birthday || !raceCategory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    // Check if email already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Insert new user
    const result = await collection.insertOne({
      name,
      email,
      contact,
      gender,
      birthday,
      raceCategory,
      affiliations: affiliations || '',
      promotional: promotional || false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Send notification email to you via Resend (best-effort; registration already saved)
    const notificationTo = process.env.NOTIFICATION_EMAIL?.trim();
    if (!notificationTo) {
      console.warn('[Register] Resend skipped: NOTIFICATION_EMAIL is not set in .env.local');
    } else if (!resend) {
      console.warn('[Register] Resend skipped: RESEND_API_KEY is not set in .env.local');
    } else {
      const from = process.env.RESEND_FROM_EMAIL?.trim() || '2XU Speed Run <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from,
        to: [notificationTo],
        subject: `New registration: ${escapeHtml(name)}`,
        html: `
          <h2>New registration submitted</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
          <p><strong>Gender:</strong> ${escapeHtml(gender)}</p>
          <p><strong>Birthday:</strong> ${escapeHtml(birthday)}</p>
          <p><strong>Race Experience:</strong> ${escapeHtml(raceCategory)}</p>
          ${affiliations ? `<p><strong>Affiliations:</strong> ${escapeHtml(affiliations)}</p>` : ''}
          <p><strong>Promotional emails:</strong> ${promotional ? 'Yes' : 'No'}</p>
        `,
      });
      if (error) {
        console.error('[Register] Resend error:', JSON.stringify(error, null, 2));
      } else if (data?.id) {
        console.log('[Register] Resend sent successfully, id:', data.id);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Registration successful',
        id: result.insertedId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : '';
    const isConfigError = message.includes('DATABASE_URL');
    return NextResponse.json(
      { error: isConfigError ? 'Server configuration error. Please try again later.' : 'Failed to process registration' },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

