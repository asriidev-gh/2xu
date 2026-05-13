import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { isAdminAuthenticated } from '@/lib/dashboardAuth';

export const dynamic = 'force-dynamic';

function parseBodyEventFields(body: Record<string, unknown>) {
  const name = body.name != null ? String(body.name).trim() : '';
  const details = body.details != null ? String(body.details) : '';
  const location = body.location != null ? String(body.location).trim() : '';
  const eventDateTimeRaw = body.eventDateTime;
  let eventDateTime: Date | null = null;
  if (typeof eventDateTimeRaw === 'string' && eventDateTimeRaw.trim()) {
    const d = new Date(eventDateTimeRaw);
    if (!Number.isNaN(d.getTime())) eventDateTime = d;
  }
  const participantUserIdsRaw = body.participantUserIds;
  const participantObjectIds: ObjectId[] = [];
  if (Array.isArray(participantUserIdsRaw)) {
    for (const id of participantUserIdsRaw) {
      const s = id != null ? String(id).trim() : '';
      if (ObjectId.isValid(s)) participantObjectIds.push(new ObjectId(s));
    }
  }
  return { name, details, location, eventDateTime, participantObjectIds };
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const col = db.collection('raceEvents');
    const docs = await col.find({}).sort({ eventDateTime: -1, createdAt: -1 }).toArray();

    const events = docs.map((doc) => ({
      _id: doc._id.toString(),
      name: String(doc.name || ''),
      details: String(doc.details || ''),
      location: String(doc.location || ''),
      eventDateTime: doc.eventDateTime ? new Date(doc.eventDateTime).toISOString() : null,
      participantUserIds: Array.isArray(doc.participantUserIds)
        ? doc.participantUserIds.map((id: unknown) =>
            id instanceof ObjectId ? id.toString() : String(id)
          )
        : [],
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    }));

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('List race events error:', error);
    return NextResponse.json({ error: 'Failed to list race events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { name, details, location, eventDateTime, participantObjectIds } = parseBodyEventFields(body);

    if (!name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }
    if (!eventDateTime) {
      return NextResponse.json({ error: 'Valid event date and time is required' }, { status: 400 });
    }

    const now = new Date();
    const client = await clientPromise;
    const db = client.db('2xu');
    const col = db.collection('raceEvents');

    const insertDoc = {
      name,
      details,
      location,
      eventDateTime,
      participantUserIds: participantObjectIds,
      participantRanks: {} as Record<string, number>,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(insertDoc);
    const id = result.insertedId.toString();

    return NextResponse.json(
      {
        event: {
          _id: id,
          name,
          details,
          location,
          eventDateTime: eventDateTime.toISOString(),
          participantUserIds: participantObjectIds.map((oid) => oid.toString()),
          participantRanks: {},
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create race event error:', error);
    return NextResponse.json({ error: 'Failed to create race event' }, { status: 500 });
  }
}
