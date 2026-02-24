import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';
import clientPromise from '@/lib/mongodb';
import { sendRegistrationConfirmation } from '@/lib/sendConfirmationEmail';

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
    const { name, email, contact, gender, birthday, raceCategory, affiliations, promotional, tShirtSize, teamMembers } = body;

    // Validate required fields
    if (!email || !raceCategory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isTeam = raceCategory === 'Team Category';

    if (isTeam) {
      const members = Array.isArray(teamMembers) ? teamMembers : [];
      if (members.length !== 4) {
        return NextResponse.json(
          { error: 'Team Category requires exactly 4 team members' },
          { status: 400 }
        );
      }
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m || typeof m !== 'object') {
          return NextResponse.json(
            { error: `Team member ${i + 1}: invalid data` },
            { status: 400 }
          );
        }
        const memberName = m.name != null ? String(m.name).trim() : '';
        const memberBirthday = m.birthday != null ? String(m.birthday).trim() : '';
        const memberGender = m.gender != null ? String(m.gender).trim() : '';
        const memberContact = m.contact != null ? String(m.contact).trim() : '';
        if (!memberName || !memberBirthday || !memberGender || !memberContact) {
          return NextResponse.json(
            { error: `Team member ${i + 1}: name, birthday, gender, and contact are required` },
            { status: 400 }
          );
        }
        const memberTShirtSize = m.tShirtSize != null ? String(m.tShirtSize).trim() : '';
        if (!memberTShirtSize) {
          return NextResponse.json(
            { error: `Team member ${i + 1}: T-shirt size is required` },
            { status: 400 }
          );
        }
      }
    } else {
      if (!name || String(name).trim() === '' || !contact || String(contact).trim() === '' || !gender || String(gender).trim() === '' || !birthday || String(birthday).trim() === '') {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      if (!tShirtSize || String(tShirtSize).trim() === '') {
        return NextResponse.json(
          { error: 'T-shirt size is required' },
          { status: 400 }
        );
      }
    }

    // Affiliations required when race experience is Team Category
    if (raceCategory === 'Team Category' && (!affiliations || String(affiliations).trim() === '')) {
      return NextResponse.json(
        { error: 'Affiliations / Club Organization / Team is required for Team Category' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    // Check if email already exists (for individual) or already used in a team registration
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const now = new Date();

    if (isTeam) {
      // Insert 4 records, one per team member (each with own name, birthday, gender, contact; same email)
      const teamId = new ObjectId();
      const members = teamMembers as Array<{ name: string; birthday: string; gender: string; contact: string; tShirtSize: string }>;
      const docs = members.map((m: { name: string; birthday: string; gender: string; contact: string; tShirtSize: string }, index: number) => ({
        name: String(m.name).trim(),
        email,
        contact: String(m.contact).trim(),
        gender: String(m.gender).trim(),
        birthday: String(m.birthday).trim(),
        tShirtSize: String(m.tShirtSize || '').trim(),
        raceCategory,
        affiliations: affiliations || '',
        promotional: promotional || false,
        teamId,
        teamMemberIndex: index + 1,
        createdAt: now,
        updatedAt: now
      }));
      const result = await collection.insertMany(docs);
      const insertedIds = Object.values(result.insertedIds);

      // Send confirmation email once to the team contact
      await sendRegistrationConfirmation(members[0].name, email, members.map((m) => m.tShirtSize).join(', '));

      const notificationTo = process.env.NOTIFICATION_EMAIL?.trim();
      if (!notificationTo) {
        console.warn('[Register] Resend skipped: NOTIFICATION_EMAIL is not set in .env.local');
      } else if (!resend) {
        console.warn('[Register] Resend skipped: RESEND_API_KEY is not set in .env.local');
      } else {
        const from = process.env.RESEND_FROM_EMAIL?.trim() || '2XU Speed Run <onboarding@resend.dev>';
        const memberList = members.map((m: { name: string; birthday: string; gender: string; contact: string; tShirtSize: string }, i: number) =>
          `${i + 1}. ${escapeHtml(m.name)} — ${escapeHtml(m.birthday)} — ${escapeHtml(m.gender)} — ${escapeHtml(m.contact)} — T-shirt: ${escapeHtml(m.tShirtSize || '')}`
        ).join('<br/>');
        const { data, error } = await resend.emails.send({
          from,
          to: [notificationTo],
          subject: `New team registration: ${escapeHtml(members.map((m: { name: string }) => m.name).join(', '))}`,
          html: `
            <h2>New team registration submitted (4 members)</h2>
            <p><strong>Team members:</strong></p>
            <p>${memberList}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
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
          id: insertedIds[0],
          teamIds: insertedIds
        },
        { status: 201 }
      );
    }

    // Insert single record for non-team
    const doc: Record<string, unknown> = {
      name,
      email,
      contact,
      gender,
      birthday,
      tShirtSize: (tShirtSize != null ? String(tShirtSize).trim() : '') || '',
      raceCategory,
      affiliations: affiliations || '',
      promotional: promotional || false,
      createdAt: now,
      updatedAt: now
    };
    const result = await collection.insertOne(doc);

    // Send confirmation email to registrant via SMTP (best-effort)
    await sendRegistrationConfirmation(name, email, String(tShirtSize || '').trim());

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
          <p><strong>T-shirt Size:</strong> ${escapeHtml(String(tShirtSize || ''))}</p>
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

