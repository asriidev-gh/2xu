import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { isAdminAuthenticated } from '@/lib/dashboardAuth';
import { buildSignupContext } from '@/lib/registrationContext';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ eventId: string }> };

const RACE_EVENT_MANUAL_CATEGORY = 'Individual';

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await context.params;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const name = body.name != null ? String(body.name).trim() : '';
    const email = body.email != null ? String(body.email).trim().toLowerCase() : '';
    const contact = body.contact != null ? String(body.contact).trim() : '';
    const gender = body.gender != null ? String(body.gender).trim() : '';
    const birthday = body.birthday != null ? String(body.birthday).trim() : '';

    if (!name || !email || !contact || !gender || !birthday) {
      return NextResponse.json(
        { error: 'Name, email, contact, gender, and birthday are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const usersCol = db.collection('users');
    const eventsCol = db.collection('raceEvents');

    const event = await eventsCol.findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventName = String(event.name || '').trim() || 'Race event';
    const promoCode = `RaceEvent${eventId}`;

    const existingUser = await usersCol.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const now = new Date();
    const signupContext = buildSignupContext(request, null);

    const doc = {
      name,
      email,
      contact,
      gender,
      birthday,
      tShirtSize: '',
      raceCategory: RACE_EVENT_MANUAL_CATEGORY,
      affiliations: '',
      promotional: false,
      promoCode,
      createdBy: eventName,
      mailerStatus: 'pending' as const,
      mailerLastAttemptAt: null,
      mailerLastError: null,
      signupContext,
      createdAt: now,
      updatedAt: now,
    };

    const insert = await usersCol.insertOne(doc);
    const newId = insert.insertedId.toString();

    const participantUserIds = Array.isArray(event.participantUserIds) ? [...event.participantUserIds] : [];
    const already = participantUserIds.some((id: unknown) =>
      id instanceof ObjectId ? id.toString() === newId : String(id) === newId
    );
    if (!already) {
      participantUserIds.push(insert.insertedId);
      await eventsCol.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: { participantUserIds, updatedAt: now } }
      );
    }

    return NextResponse.json(
      {
        user: {
          _id: newId,
          name,
          email,
          contact,
          gender,
          birthday,
          raceCategory: RACE_EVENT_MANUAL_CATEGORY,
          affiliations: '',
          promoCode,
          createdBy: eventName,
          createdAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Manual race event participant error:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
}
