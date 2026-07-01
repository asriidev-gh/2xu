import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { isAdvocatePromoCode, isFcAdvocatePromoCode, getFcAdvocatePricing } from '@/lib/promoCodes';

export { isAdvocatePromoCode } from '@/lib/promoCodes';

export type RegistrationConfirmationEmailPreview = {
  subject: string;
  html: string;
  text: string;
};

type MailerSendResult =
  | { success: true; error: null; preview: RegistrationConfirmationEmailPreview }
  | { success: false; error: string; preview: RegistrationConfirmationEmailPreview };

type BuildRegistrationConfirmationEmailInput = {
  participantName: string;
  speedDistance?: string;
  orderNumber?: string;
  bibNumber?: string;
  raceCategory?: string;
  promoCode?: string;
};

type SendRegistrationConfirmationOptions = {
  promoCode?: string;
  raceCategory?: string;
  speedDistance?: string;
  paymentProofSent?: boolean;
  paymentProofUrl?: string;
  orderNumber?: string;
  bibNumber?: string;
};

function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Runner';
  return trimmed.split(/\s+/)[0];
}

function formatOrderNumber(id: string | undefined): string {
  const raw = String(id || '').trim();
  if (!raw) return '—';
  return raw.slice(-5).toUpperCase();
}

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

function formatMailerError(err: unknown): string {
  const e = err as {
    code?: string;
    responseCode?: number;
    message?: string;
    response?: string;
  };
  const msg = typeof e?.message === 'string' ? e.message : String(err);
  const code = typeof e?.code === 'string' ? e.code : '';
  const responseCode = typeof e?.responseCode === 'number' ? e.responseCode : null;
  const responseText = typeof e?.response === 'string' ? e.response.trim() : '';
  const parts = [
    code || null,
    responseCode != null ? String(responseCode) : null,
    msg || null,
    responseText || null,
  ].filter(Boolean);
  return parts.join(' | ').slice(0, 400) || 'Unknown mailer error';
}

function formatResendError(err: unknown): string {
  const e = err as { message?: string; name?: string };
  const msg = typeof e?.message === 'string' ? e.message : String(err);
  const name = typeof e?.name === 'string' ? e.name : '';
  return [name || null, msg || null].filter(Boolean).join(' | ').slice(0, 400) || 'Unknown Resend error';
}

export function getRegistrationNotificationCc(notificationTo: string): string[] {
  const baseCc = ['1@oneofakindasia.com'];
  const toNorm = String(notificationTo || '').trim().toLowerCase();
  return baseCc.filter((email) => email.toLowerCase() !== toNorm);
}

export function buildPaymentProofAdminNotificationHtml({
  paymentProofSent,
  paymentProofUrl,
  promoCode,
}: {
  paymentProofSent?: boolean;
  paymentProofUrl?: string;
  promoCode?: string;
}): string {
  const proofUrl = String(paymentProofUrl || '').trim();
  const promo = String(promoCode || '').trim();
  const viaEmail = paymentProofSent === true;
  const isAdvocate = isAdvocatePromoCode(promo);
  const isFcPromo = isFcAdvocatePromoCode(promo);
  const promoNote = isFcPromo
    ? (() => {
        const fcPricing = getFcAdvocatePricing();
        const feeLine = `fixed registration fee ₱${fcPricing.phpAmount.toLocaleString('en-PH')}`;
        const singletLine = fcPricing.singletNote
          ? ` — includes ${fcPricing.singletNote}`
          : '';
        return `<p><strong>Promo code:</strong> ${escapeHtml(promo)} (${feeLine}${singletLine})</p>`;
      })()
    : '';

  if (proofUrl) {
    return `<p><strong>Payment proof:</strong> <a href="${escapeHtml(proofUrl)}" target="_blank" rel="noopener noreferrer">View uploaded screenshot</a></p>${promoNote}`;
  }
  if (viaEmail) {
    return `<p><strong>Payment proof:</strong> Sent through email</p>${promoNote}`;
  }
  if (isAdvocate) {
    return `<p><strong>Promo code:</strong> ${escapeHtml(promo)} (Advocate registration)</p>`;
  }
  return '<p><strong>Payment proof:</strong> Not provided</p>';
}

function formatRaceDistanceLabel(speedDistance: string): string {
  const normalized = speedDistance.trim().toUpperCase();
  if (!normalized) return '2KM / 5KM';
  return normalized;
}

function formatRegistrationType(raceCategory: string, promoCode: string): string {
  if (isFcAdvocatePromoCode(promoCode)) {
    return "VIP — Mission Strong Founder's Card";
  }
  const category = raceCategory.trim();
  if (category === 'Patron') return 'VIP Patron';
  if (category) return category;
  return 'Basecamp';
}

const DEFAULT_2XU_SHOP_URL =
  'https://ph.2xu.com/?utm_source=SpeedSeries&utm_medium=referral&utm_campaign=SpeedSeries_20Off&utm_id=SPEEDSERIES20&utm_content=event_registration';

export function buildRegistrationConfirmationEmail({
  participantName,
  speedDistance = '',
  orderNumber = '',
  bibNumber = '',
  raceCategory = '',
  promoCode = '',
}: BuildRegistrationConfirmationEmailInput): RegistrationConfirmationEmailPreview {
  const firstName = getFirstName(participantName);
  const raceDistanceLabel = formatRaceDistanceLabel(speedDistance);
  const orderLabel = formatOrderNumber(orderNumber);
  const bibLabel = bibNumber.trim() || 'Auto-assigned (we generate random number)';
  const registrationType = formatRegistrationType(raceCategory, promoCode);
  const showSingletAddOn = isFcAdvocatePromoCode(promoCode);

  const contactNumber = process.env.MAILER_CONTACT_NUMBER?.trim() || '09053162845';
  const eventDate = process.env.MAILER_BASECAMP_EVENT_DATE?.trim() || 'July 26, 2026';
  const assemblyTime = process.env.MAILER_BASECAMP_ASSEMBLY_TIME?.trim() || '';
  const kitPickupDetails =
    process.env.MAILER_BASECAMP_KIT_PICKUP?.trim() || 'July 18 and 25 | 3pm to 7pm';
  const raceDayDetails =
    process.env.MAILER_BASECAMP_RACE_DAY?.trim() || 'Basecamp 2 at Baguio | July 26 | 6:30am';
  const raceBriefNotice =
    process.env.MAILER_BASECAMP_RACE_BRIEF_NOTICE?.trim() ||
    "We'll email you final race brief a week before";
  const locationNotice =
    process.env.MAILER_BASECAMP_LOCATION_NOTICE?.trim() ||
    'Final Route will be announced on July 8';
  const instagramHandle =
    process.env.MAILER_INSTAGRAM_HANDLE?.trim() || '@SpeedSeriespoweredby2XU';
  const instagramUrl =
    process.env.MAILER_INSTAGRAM_URL?.trim() || 'https://www.instagram.com/speedseriesph/';
  const shopUrl = process.env.MAILER_2XU_SHOP_URL?.trim() || DEFAULT_2XU_SHOP_URL;
  const preheader = 'Your Basecamp registration is confirmed. Save this email.';
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://www.oneofakindasia.com';

  const headerBanner = baseUrl
    ? `
    <div style="margin:0 0 20px 0;">
      <img src="${escapeHtml(baseUrl)}/images/2xu-event-mail-banner.jpg" alt="2XU Speed Series Basecamp" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </div>
  `
    : '';

  const singletAddOnHtml = showSingletAddOn
    ? `<li style="margin-bottom:6px;"><strong>Add-On:</strong> Limited Edition 2XU Race Singlet</li>`
    : '';

  const singletAddOnText = showSingletAddOn ? '\nAdd-On: Limited Edition 2XU Race Singlet' : '';

  const dateDetailsLine = assemblyTime
    ? `${eventDate} | Assembly Time: ${assemblyTime}`
    : `${eventDate} | Assembly Time:`;

  const html = `
    <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    ${headerBanner}
    <p style="margin:0 0 8px 0; font-size:12px; font-weight:bold; letter-spacing:0.08em; color:#ea580c;">REGISTRATION CONFIRMED</p>
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>You&rsquo;re in. Your spot for <strong>2XU Speed Series Basecamp</strong> is secured.</p>
    <p><strong>Save this email.</strong></p>
    <div style="margin:20px 0; padding:16px; background:#f0fdf4; border-radius:8px; border:1px solid #86efac;">
      <p style="margin:0 0 12px 0; font-weight:bold; color:#166534; font-size:13px; letter-spacing:0.05em;">YOUR REGISTRATION DETAILS</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Event:</strong> 2XU Speed Series Basecamp</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Location:</strong> ${escapeHtml(locationNotice)}</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Date:</strong> ${escapeHtml(dateDetailsLine)}</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Race Distance:</strong> ${escapeHtml(raceDistanceLabel)}</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Order #:</strong> ${escapeHtml(orderLabel)} | <strong>Bib #:</strong> ${escapeHtml(bibLabel)}</p>
      <p style="margin:0; font-size:14px; color:#374151;"><strong>Registration Type:</strong> ${escapeHtml(registrationType)}</p>
    </div>
    <p style="margin:24px 0 8px 0; font-weight:bold; color:#1f2937;">YOUR BASECAMP INCLUDES:</p>
    <ol style="margin:0 0 20px 0; padding-left:20px; color:#374151;">
      <li style="margin-bottom:6px;">2KM / 5KM Altitude Trail Run</li>
      <li style="margin-bottom:6px;">2XU Recovery Session</li>
      <li style="margin-bottom:6px;">Coffee Camp</li>
      <li style="margin-bottom:6px;">Sports Photography</li>
      <li style="margin-bottom:6px;">Prospex Navigation Quest</li>
      <li style="margin-bottom:6px;">Green Talk</li>
      <li style="margin-bottom:6px;">Music + After Run Party</li>
      ${singletAddOnHtml}
    </ol>
    <p style="margin:24px 0 8px 0; font-weight:bold; color:#1f2937;">YOUR 20% GEAR DISCOUNT</p>
    <p style="margin:0 0 8px 0; color:#374151;">To prepare, perform, and recover like a Basecamp athlete:</p>
    <p style="margin:0 0 24px 0; color:#374151;">
      Unlock Exclusive 2XU Speed Series discount at 20% <a href="${escapeHtml(shopUrl)}" style="color:#ea580c; font-weight:bold;">here</a>
    </p>
    <p style="margin:24px 0 8px 0; font-weight:bold; color:#1f2937;">WHAT HAPPENS NEXT</p>
    <ol style="margin:0 0 20px 0; padding-left:20px; color:#374151;">
      <li style="margin-bottom:8px;"><strong>Kit Pickup:</strong> Basecamp 1 at 2XU Opus | ${escapeHtml(kitPickupDetails)}</li>
      <li style="margin-bottom:8px;"><strong>Race Day:</strong> ${escapeHtml(raceDayDetails)}</li>
      <li style="margin-bottom:0;"><strong>Updates:</strong> ${escapeHtml(raceBriefNotice)}</li>
    </ol>
    <p style="margin:0 0 20px 0; color:#374151;"><strong>Important:</strong> Bring your ID + this confirmation email for kit pickup.</p>
    <p style="margin:0 0 20px 0; color:#374151;">Questions? Reply here or message <a href="${escapeHtml(instagramUrl)}" style="color:#ea580c;">${escapeHtml(instagramHandle)}</a> or WhatsApp ${escapeHtml(contactNumber)}.</p>
    <p style="margin:0 0 8px 0; color:#374151; font-style:italic;">Human Performance multiplied</p>
    <p style="margin:0 0 8px 0; font-weight:bold; color:#1f2937;">Train High. Start at Basecamp. Be 2X Better.</p>
    <p style="margin:0 0 16px 0; color:#374151;">See you on the mountain.</p>
    <p><strong>2XU Philippines</strong><br/>#2XUSpeedSeries #BasecampVIP #2XUspeedSeries #prospexSpeed</p>
    <p style="margin-top:20px; font-size:14px; color:#6b7280;"><em>P.S. Get an exclusive 20% discount for full experience of the brand at <a href="${escapeHtml(shopUrl)}" style="color:#ea580c;">ph.2XU.com</a></em></p>
  `;

  const plainBody = `${preheader}

REGISTRATION CONFIRMED

Hi ${firstName},

You're in. Your spot for 2XU Speed Series Basecamp is secured.

Save this email.

YOUR REGISTRATION DETAILS
Event: 2XU Speed Series Basecamp
Location: ${locationNotice}
Date: ${dateDetailsLine}
Race Distance: ${raceDistanceLabel}
Order #: ${orderLabel} | Bib #: ${bibLabel}
Registration Type: ${registrationType}

YOUR BASECAMP INCLUDES:
1. 2KM / 5KM Altitude Trail Run
2. 2XU Recovery Session
3. Coffee Camp
4. Sports Photography
5. Prospex Navigation Quest
6. Green Talk
7. Music + After Run Party${singletAddOnText}

YOUR 20% GEAR DISCOUNT
To prepare, perform, and recover like a Basecamp athlete:
Unlock Exclusive 2XU Speed Series discount at 20% here: ${shopUrl}

WHAT HAPPENS NEXT
1. Kit Pickup: Basecamp 1 at 2XU Opus | ${kitPickupDetails}
2. Race Day: ${raceDayDetails}
3. Updates: ${raceBriefNotice}

Important: Bring your ID + this confirmation email for kit pickup.

Questions? Reply here or message ${instagramHandle} or WhatsApp ${contactNumber}.

Human Performance multiplied
Train High. Start at Basecamp. Be 2X Better.
See you on the mountain.

2XU Philippines
#2XUSpeedSeries #BasecampVIP #2XUspeedSeries #prospexSpeed

P.S. Get an exclusive 20% discount for full experience of the brand at ph.2XU.com (${shopUrl})`;

  const subject = '2XU Speed Series Basecamp Slot Secured + 20% Gear Code Inside';

  return {
    subject,
    html,
    text: `2XU Speed Series Basecamp\n\n${plainBody}`,
  };
}

export async function sendRegistrationConfirmation(
  participantName: string,
  participantEmail: string,
  speedDistanceOrOptions: string | SendRegistrationConfirmationOptions = '',
  orderNumber = '',
  bibNumber = ''
): Promise<MailerSendResult> {
  const options =
    typeof speedDistanceOrOptions === 'string'
      ? {
          speedDistance: speedDistanceOrOptions,
          orderNumber,
          bibNumber,
        }
      : speedDistanceOrOptions || {};

  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || from;

  const preview = buildRegistrationConfirmationEmail({
    participantName,
    speedDistance: options.speedDistance || '',
    orderNumber: options.orderNumber || '',
    bibNumber: options.bibNumber || '',
    raceCategory: options.raceCategory || '',
    promoCode: options.promoCode || '',
  });

  const ccRecipients = [
    // 'oneofakindasiaph@gmail.com',
    'ops@oneofakindasia.com',
    '1@oneofakindasia.com',
  ];

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { error } = await resend.emails.send({
        from: resendFrom,
        to: [participantEmail],
        cc: ccRecipients,
        subject: preview.subject,
        html: preview.html,
        text: preview.text,
      });
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      console.log('[sendConfirmationEmail] Confirmation email sent via Resend to', participantEmail);
      return { success: true, error: null, preview };
    } catch (err) {
      console.error('[sendConfirmationEmail] Resend failed:', err);
      return { success: false, error: formatResendError(err), preview };
    }
  }

  if (!host || !port || !user || !pass) {
    console.warn(
      '[sendConfirmationEmail] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local'
    );
    return {
      success: false,
      error: 'SMTP not configured',
      preview,
    };
  }

  const portNum = parseInt(port, 10);
  const secure = portNum === 465;

  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure,
    auth: { user, pass },
  });
  try {
    await transporter.sendMail({
      from,
      to: participantEmail,
      cc: ccRecipients,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
    });
    console.log('[sendConfirmationEmail] Confirmation email sent to', participantEmail);
    return { success: true, error: null, preview };
  } catch (err) {
    console.error('[sendConfirmationEmail] Failed to send:', err);
    return {
      success: false,
      error: formatMailerError(err),
      preview,
    };
  }
}
