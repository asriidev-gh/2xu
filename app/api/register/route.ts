import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';
import clientPromise from '@/lib/mongodb';
import { buildSignupContext, type ClientSignupContext } from '@/lib/registrationContext';
import {
  sendRegistrationConfirmation,
  buildPaymentProofAdminNotificationHtml,
  getRegistrationNotificationCc,
} from '@/lib/sendConfirmationEmail';
import { generateBibNumber } from '@/lib/generateBibNumber';
import { isPaymentProofUrlFromCloudinary } from '@/lib/cloudinary';
import {
  normalizePhilippinesContact,
  isPhilippinesContactIncomplete,
} from '@/lib/normalizePhilippinesContact';
import { PUBLIC_RACE_CATEGORY_SET, SPEED_DISTANCES_ALLOWED, SPEED_DISTANCES_OPTIONS_TEXT } from '@/lib/raceCategories';
import {
  isAcceptedPromoCode,
  isAdvocatePromoCode,
  normalizePromoCode,
  promoRequiresSingleUseCheck,
} from '@/lib/promoCodes';

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
    const {
      name,
      email,
      contact,
      gender,
      birthday,
      raceCategory,
      affiliations,
      promotional,
      waiverAccepted,
      tShirtSize,
      promoCode,
      teamMembers,
      speedDistance: speedDistanceInput,
      paymentProofSent: paymentProofSentInput,
      paymentProofUrl: paymentProofUrlInput,
      clientContext,
    } = body;

    const paymentProofSent = paymentProofSentInput === true;
    const paymentProofUrlRaw =
      paymentProofUrlInput != null ? String(paymentProofUrlInput).trim() : '';

    // Validate required fields
    if (!email || !raceCategory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (waiverAccepted !== true) {
      return NextResponse.json(
        { error: 'You must accept the Participant Digital Waiver to register.' },
        { status: 400 }
      );
    }

    const raceCategoryTrimmed = String(raceCategory || '').trim();
    if (!PUBLIC_RACE_CATEGORY_SET.has(raceCategoryTrimmed)) {
      return NextResponse.json(
        { error: 'Invalid or unavailable race experience category.' },
        { status: 400 }
      );
    }

    const speedDistanceRaw =
      speedDistanceInput ?? (body as { patronSpeedDistance?: unknown }).patronSpeedDistance;
    const speedDistance =
      speedDistanceRaw != null ? String(speedDistanceRaw).trim() : '';
    if (!SPEED_DISTANCES_ALLOWED.has(speedDistance)) {
      return NextResponse.json(
        {
          error:
            `Please select a speed option: choose ${SPEED_DISTANCES_OPTIONS_TEXT}.`,
        },
        { status: 400 }
      );
    }

    const isTeam = raceCategory === 'Team Category';
    const isDuo = raceCategory === 'The Speed Duo - 2XU pair';
    const isGroupCategory = isTeam || isDuo;
    const requiredMemberCount = isTeam ? 4 : isDuo ? 2 : 0;
    const memberLabel = isDuo ? 'Duo member' : 'Team member';

    if (isGroupCategory) {
      const members = Array.isArray(teamMembers) ? teamMembers : [];
      if (members.length !== requiredMemberCount) {
        return NextResponse.json(
          { error: `${raceCategory} requires exactly ${requiredMemberCount} members` },
          { status: 400 }
        );
      }
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m || typeof m !== 'object') {
          return NextResponse.json(
            { error: `${memberLabel} ${i + 1}: invalid data` },
            { status: 400 }
          );
        }
        const memberName = m.name != null ? String(m.name).trim() : '';
        const memberBirthday = m.birthday != null ? String(m.birthday).trim() : '';
        const memberGender = m.gender != null ? String(m.gender).trim() : '';
        const memberContactNorm = normalizePhilippinesContact(m.contact);
        if (
          !memberName ||
          !memberBirthday ||
          !memberGender ||
          isPhilippinesContactIncomplete(memberContactNorm)
        ) {
          return NextResponse.json(
            { error: `${memberLabel} ${i + 1}: name, birthday, gender, and contact are required` },
            { status: 400 }
          );
        }
        const memberTShirtSize = m.tShirtSize != null ? String(m.tShirtSize).trim() : '';
        if (!memberTShirtSize) {
          return NextResponse.json(
            { error: `${memberLabel} ${i + 1}: T-shirt size is required` },
            { status: 400 }
          );
        }
      }
    } else {
      if (
        !name ||
        String(name).trim() === '' ||
        isPhilippinesContactIncomplete(normalizePhilippinesContact(contact)) ||
        !gender ||
        String(gender).trim() === '' ||
        !birthday ||
        String(birthday).trim() === ''
      ) {
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
    const signupContext = buildSignupContext(request, clientContext as ClientSignupContext | undefined);

    // Promo formats: SPS2XU, FC000001–FC000500, SPSUAAPElite (Athletes only), MissionStrong500 (multi-use)
    const rawPromo = promoCode != null ? normalizePromoCode(String(promoCode)) : '';
    const raceCategoryForPromo = String(raceCategory || '').trim();
    const formatOk = rawPromo.length > 0 && isAcceptedPromoCode(rawPromo, raceCategoryForPromo);
    let savedPromo = '';
    if (formatOk) {
      const existingWithPromo = promoRequiresSingleUseCheck(rawPromo)
        ? await collection.findOne({ promoCode: rawPromo })
        : null;
      if (existingWithPromo) {
        return NextResponse.json(
          { error: 'Promo code already used. Please use a different code.' },
          { status: 409 }
        );
      } else {
        savedPromo = rawPromo;
      }
    }

    let paymentProofUrl = '';
    if (paymentProofUrlRaw) {
      if (!isPaymentProofUrlFromCloudinary(paymentProofUrlRaw)) {
        return NextResponse.json(
          { error: 'Invalid payment proof upload. Please upload your screenshot again.' },
          { status: 400 }
        );
      }
      paymentProofUrl = paymentProofUrlRaw;
    }

    const isAdvocateRegistrant = isAdvocatePromoCode(savedPromo);
    if (!isAdvocateRegistrant && !paymentProofSent && !paymentProofUrl) {
      return NextResponse.json(
        {
          error:
            'Please confirm you sent proof of payment by email, or upload your payment screenshot before submitting.',
        },
        { status: 400 }
      );
    }

    if (isGroupCategory) {
      // Insert one record per group member (same contact email, own personal fields)
      const teamId = new ObjectId();
      const members = teamMembers as Array<{ name: string; birthday: string; gender: string; contact: string; tShirtSize: string }>;
      const memberIds = members.map(() => new ObjectId());
      const docs = members.map((m: { name: string; birthday: string; gender: string; contact: string; tShirtSize: string }, index: number) => ({
        _id: memberIds[index],
        name: String(m.name).trim(),
        email,
        contact: normalizePhilippinesContact(m.contact),
        gender: String(m.gender).trim(),
        birthday: String(m.birthday).trim(),
        tShirtSize: String(m.tShirtSize || '').trim(),
        raceCategory,
        affiliations: affiliations || '',
        promotional: promotional || false,
        promoCode: savedPromo,
        paymentProofSent,
        paymentProofUrl,
        bibNumber: generateBibNumber(speedDistance, memberIds[index]),
        mailerStatus: 'pending',
        mailerLastAttemptAt: null,
        mailerLastError: null,
        teamId,
        teamMemberIndex: index + 1,
        speedDistance,
        signupContext,
        createdAt: now,
        updatedAt: now
      }));
      const result = await collection.insertMany(docs);
      const insertedIds = Object.values(result.insertedIds);
      const primaryId = memberIds[0];

      // Send confirmation email once to the group contact
      const mailResult = await sendRegistrationConfirmation(
        members[0].name,
        email,
        {
          promoCode: savedPromo,
          raceCategory,
          speedDistance,
          paymentProofSent,
          paymentProofUrl,
          orderNumber: String(primaryId),
          bibNumber: generateBibNumber(speedDistance, primaryId),
        }
      );
      await collection.updateMany(
        { _id: { $in: insertedIds } },
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

      const notificationTo = process.env.NOTIFICATION_EMAIL?.trim();
      if (!notificationTo) {
        console.warn('[Register] Resend skipped: NOTIFICATION_EMAIL is not set in .env.local');
      } else if (!resend) {
        console.warn('[Register] Resend skipped: RESEND_API_KEY is not set in .env.local');
      } else {
        const from = process.env.RESEND_FROM_EMAIL?.trim() || '2XU Speed Run <onboarding@resend.dev>';
        const memberList = members
          .map(
            (
              m: { name: string; birthday: string; gender: string; contact: string; tShirtSize: string },
              i: number
            ) =>
              `${i + 1}. ${escapeHtml(m.name)} — ${escapeHtml(m.birthday)} — ${escapeHtml(m.gender)} — ${escapeHtml(
                normalizePhilippinesContact(m.contact)
              )} — T-shirt: ${escapeHtml(m.tShirtSize || '')}`
          )
          .join('<br/>');
        const groupLabel = isDuo ? 'duo' : 'team';
        const notificationCc = getRegistrationNotificationCc(notificationTo);
        const { data, error } = await resend.emails.send({
          from,
          to: [notificationTo],
          ...(notificationCc.length > 0 ? { cc: notificationCc } : {}),
          subject: `New ${groupLabel} registration: ${escapeHtml(members.map((m: { name: string }) => m.name).join(', '))}`,
          html: `
            <h2>New ${groupLabel} registration submitted (${requiredMemberCount} members)</h2>
            <p><strong>${isDuo ? 'Duo' : 'Team'} members:</strong></p>
            <p>${memberList}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Race Experience:</strong> ${escapeHtml(raceCategory)}</p>
            <p><strong>Speed option:</strong> ${escapeHtml(speedDistance)}</p>
            ${affiliations ? `<p><strong>Affiliations:</strong> ${escapeHtml(affiliations)}</p>` : ''}
            ${buildPaymentProofAdminNotificationHtml({
              paymentProofSent,
              paymentProofUrl,
              promoCode: savedPromo,
            })}
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
          teamIds: insertedIds,
        },
        { status: 201 }
      );
    }

    // Insert single record for non-team
    const contactForDb = normalizePhilippinesContact(contact);
    const registrationId = new ObjectId();
    const bibNumber = generateBibNumber(speedDistance, registrationId);
    const doc: Record<string, unknown> = {
      _id: registrationId,
      name,
      email,
      contact: contactForDb,
      gender,
      birthday,
      tShirtSize: (tShirtSize != null ? String(tShirtSize).trim() : '') || '',
      raceCategory,
      affiliations: affiliations || '',
      promotional: promotional || false,
      promoCode: savedPromo,
      paymentProofSent,
      paymentProofUrl,
      bibNumber,
      mailerStatus: 'pending',
      mailerLastAttemptAt: null,
      mailerLastError: null,
      signupContext,
      createdAt: now,
      updatedAt: now,
    };
    doc.speedDistance = speedDistance;
    const result = await collection.insertOne(doc);

    // Send confirmation email to registrant via SMTP (best-effort)
    const mailResult = await sendRegistrationConfirmation(name, email, {
      promoCode: savedPromo,
      raceCategory,
      speedDistance,
      paymentProofSent,
      paymentProofUrl,
      orderNumber: String(registrationId),
      bibNumber,
    });
    await collection.updateOne(
      { _id: result.insertedId },
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

    // Send notification email to you via Resend (best-effort; registration already saved)
    const notificationTo = process.env.NOTIFICATION_EMAIL?.trim();
    if (!notificationTo) {
      console.warn('[Register] Resend skipped: NOTIFICATION_EMAIL is not set in .env.local');
    } else if (!resend) {
      console.warn('[Register] Resend skipped: RESEND_API_KEY is not set in .env.local');
    } else {
      const from = process.env.RESEND_FROM_EMAIL?.trim() || '2XU Speed Run <onboarding@resend.dev>';
      const notificationCc = getRegistrationNotificationCc(notificationTo);
      const { data, error } = await resend.emails.send({
        from,
        to: [notificationTo],
        ...(notificationCc.length > 0 ? { cc: notificationCc } : {}),
        subject: `New registration: ${escapeHtml(name)}`,
        html: `
          <h2>New registration submitted</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Contact:</strong> ${escapeHtml(contactForDb)}</p>
          <p><strong>Gender:</strong> ${escapeHtml(gender)}</p>
          <p><strong>Birthday:</strong> ${escapeHtml(birthday)}</p>
          <p><strong>Race Experience:</strong> ${escapeHtml(raceCategory)}</p>
          <p><strong>Speed option:</strong> ${escapeHtml(speedDistance)}</p>
          ${affiliations ? `<p><strong>Affiliations:</strong> ${escapeHtml(affiliations)}</p>` : ''}
          <p><strong>T-shirt Size:</strong> ${escapeHtml(String(tShirtSize || ''))}</p>
          ${buildPaymentProofAdminNotificationHtml({
            paymentProofSent,
            paymentProofUrl,
            promoCode: savedPromo,
          })}
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
        id: result.insertedId,
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

