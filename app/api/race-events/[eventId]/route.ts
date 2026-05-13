import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { isAdminAuthenticated } from '@/lib/dashboardAuth';
import { formatSignupContextView } from '@/lib/registrationContext';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ eventId: string }> };

function ranksFromDoc(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isInteger(n) && n >= 1) out[k] = n;
  }
  return out;
}

function validateParticipantRanks(
  raw: unknown,
  participantUserIds: string[]
): { ok: true; value: Record<string, number> } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'participantRanks must be an object' };
  }
  const n = participantUserIds.length;
  const idSet = new Set(participantUserIds);
  const obj = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  const seenRanks = new Set<number>();
  for (const [k, v] of Object.entries(obj)) {
    if (!idSet.has(k)) {
      return { ok: false, error: 'participantRanks contains an id that is not in this event' };
    }
    const num = typeof v === 'number' && Number.isInteger(v) ? v : parseInt(String(v), 10);
    if (!Number.isInteger(num) || num < 1 || num > n) {
      return { ok: false, error: `Each rank must be an integer from 1 to ${n}` };
    }
    if (seenRanks.has(num)) {
      return { ok: false, error: 'Duplicate overall rank is not allowed' };
    }
    seenRanks.add(num);
    out[k] = num;
  }
  return { ok: true, value: out };
}

function pruneAndValidateRanks(
  ranks: Record<string, number>,
  participantUserIds: string[]
): { ok: true; value: Record<string, number> } | { ok: false; error: string } {
  const idSet = new Set(participantUserIds);
  const pruned: Record<string, number> = {};
  for (const [k, v] of Object.entries(ranks)) {
    if (idSet.has(k) && Number.isInteger(v) && v >= 1) pruned[k] = v;
  }
  return validateParticipantRanks(pruned, participantUserIds);
}

function parsePatchFields(body: Record<string, unknown>) {
  const out: {
    name?: string;
    details?: string;
    location?: string;
    eventDateTime?: Date;
    participantUserIds?: ObjectId[];
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name) out.name = name;
  }
  if (body.details !== undefined) {
    out.details = String(body.details);
  }
  if (body.location !== undefined) {
    out.location = String(body.location).trim();
  }
  if (body.eventDateTime !== undefined) {
    const raw = body.eventDateTime;
    if (typeof raw === 'string' && raw.trim()) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) out.eventDateTime = d;
    }
  }
  if (body.participantUserIds !== undefined && Array.isArray(body.participantUserIds)) {
    const ids: ObjectId[] = [];
    for (const id of body.participantUserIds) {
      const s = id != null ? String(id).trim() : '';
      if (ObjectId.isValid(s)) ids.push(new ObjectId(s));
    }
    out.participantUserIds = ids;
  }

  return out;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await context.params;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const eventsCol = db.collection('raceEvents');
    const usersCol = db.collection('users');

    const doc = await eventsCol.findOne({ _id: new ObjectId(eventId) });
    if (!doc) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const participantUserIds: string[] = Array.isArray(doc.participantUserIds)
      ? doc.participantUserIds.map((id: unknown) =>
          id instanceof ObjectId ? id.toString() : String(id)
        )
      : [];

    const rankMap = ranksFromDoc((doc as { participantRanks?: unknown }).participantRanks);
    const rankValidated = validateParticipantRanks(rankMap, participantUserIds);
    const safeRankMap = rankValidated.ok ? rankValidated.value : {};

    const oids = participantUserIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    const users =
      oids.length > 0
        ? await usersCol
            .find({ _id: { $in: oids } })
            .toArray()
        : [];

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const participants = participantUserIds.map((id) => {
      const u = userMap.get(id);
      if (!u) {
        return {
          _id: id,
          name: '(removed user)',
          email: '',
          contact: '',
          gender: '',
          birthday: '',
          affiliations: '',
          promoCode: '',
          overallRank: safeRankMap[id] ?? null,
        };
      }
      return {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        contact: u.contact,
        gender: u.gender,
        birthday: u.birthday,
        raceCategory: (u as { raceCategory?: string }).raceCategory || '',
        affiliations: u.affiliations || '',
        promoCode: (u as { promoCode?: string }).promoCode || '',
        createdBy: (u as { createdBy?: string }).createdBy || '',
        signupContext: formatSignupContextView((u as { signupContext?: unknown }).signupContext),
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        overallRank: safeRankMap[u._id.toString()] ?? null,
      };
    });

    const event = {
      _id: doc._id.toString(),
      name: String(doc.name || ''),
      details: String(doc.details || ''),
      location: String(doc.location || ''),
      eventDateTime: doc.eventDateTime ? new Date(doc.eventDateTime).toISOString() : null,
      participantUserIds,
      participantRanks: safeRankMap,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    };

    return NextResponse.json({ event, participants }, { status: 200 });
  } catch (error) {
    console.error('Get race event error:', error);
    return NextResponse.json({ error: 'Failed to load race event' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await context.params;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const patch = parsePatchFields(body);
    const ranksPayload = body.participantRanks;

    const client = await clientPromise;
    const db = client.db('2xu');
    const col = db.collection('raceEvents');

    const existing = await col.findOne({ _id: new ObjectId(eventId) });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existingIds: string[] = Array.isArray(existing.participantUserIds)
      ? existing.participantUserIds.map((id: unknown) =>
          id instanceof ObjectId ? id.toString() : String(id)
        )
      : [];

    const mergedIds =
      patch.participantUserIds !== undefined
        ? patch.participantUserIds.map((oid) => oid.toString())
        : existingIds;

    let nextRanks: Record<string, number> | undefined;
    if (ranksPayload !== undefined) {
      const validated = validateParticipantRanks(ranksPayload, mergedIds);
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }
      nextRanks = validated.value;
    } else if (patch.participantUserIds !== undefined) {
      const prevRanks = ranksFromDoc((existing as { participantRanks?: unknown }).participantRanks);
      const pruned = pruneAndValidateRanks(prevRanks, mergedIds);
      if (!pruned.ok) {
        return NextResponse.json({ error: pruned.error }, { status: 400 });
      }
      nextRanks = pruned.value;
    }

    const mongoPatch: Record<string, unknown> = { ...patch };
    if (Object.keys(mongoPatch).length === 0 && nextRanks === undefined) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const now = new Date();
    const $set: Record<string, unknown> = { updatedAt: now, ...mongoPatch };
    if (nextRanks !== undefined) {
      $set.participantRanks = nextRanks;
    }

    const result = await col.findOneAndUpdate({ _id: new ObjectId(eventId) }, { $set }, { returnDocument: 'after' });

    const doc = result;
    if (!doc) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const participantUserIdsOut: string[] = Array.isArray(doc.participantUserIds)
      ? doc.participantUserIds.map((id: unknown) =>
          id instanceof ObjectId ? id.toString() : String(id)
        )
      : [];

    const rankMapOut = ranksFromDoc((doc as { participantRanks?: unknown }).participantRanks);
    const rankCheck = validateParticipantRanks(rankMapOut, participantUserIdsOut);
    const participantRanksOut = rankCheck.ok ? rankCheck.value : {};

    const event = {
      _id: doc._id.toString(),
      name: String(doc.name || ''),
      details: String(doc.details || ''),
      location: String(doc.location || ''),
      eventDateTime: doc.eventDateTime ? new Date(doc.eventDateTime).toISOString() : null,
      participantUserIds: participantUserIdsOut,
      participantRanks: participantRanksOut,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    };

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error('Patch race event error:', error);
    return NextResponse.json({ error: 'Failed to update race event' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await context.params;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('2xu');
    const col = db.collection('raceEvents');
    const del = await col.deleteOne({ _id: new ObjectId(eventId) });
    if (del.deletedCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete race event error:', error);
    return NextResponse.json({ error: 'Failed to delete race event' }, { status: 500 });
  }
}
