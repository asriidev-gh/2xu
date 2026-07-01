import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { isAdvocatePromoCode, isFcAdvocatePromoCode, FC_ADVOCATE_FIXED_PHP } from '@/lib/promoCodes';

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

function formatDistanceCategory(speedDistance: string): string {
  const normalized = speedDistance.trim().toUpperCase();
  if (!normalized) return '—';
  return normalized.replace(/KM$/i, 'K');
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

function formatMailerContactLine(contactName: string, contactNumber: string): string {
  const parts = [contactName, contactNumber].map((part) => part.trim()).filter(Boolean);
  return parts.join(' — ');
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
    ? `<p><strong>Promo code:</strong> ${escapeHtml(promo)} (fixed registration fee ₱${FC_ADVOCATE_FIXED_PHP.toLocaleString('en-PH')})</p>`
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

export function buildRegistrationConfirmationEmail({
  participantName,
  speedDistance = '',
  orderNumber = '',
  bibNumber = '',
}: BuildRegistrationConfirmationEmailInput): RegistrationConfirmationEmailPreview {
  const firstName = getFirstName(participantName);
  const categoryLabel = formatDistanceCategory(speedDistance);
  const orderLabel = formatOrderNumber(orderNumber);
  const bibLabel = bibNumber.trim() || 'Auto-assigned (we generate random number)';
  const contactName = process.env.MAILER_CONTACT_NAME?.trim() || 'Pinkee';
  const contactNumber = process.env.MAILER_CONTACT_NUMBER?.trim() || '09053162845';
  const contactLine = formatMailerContactLine(contactName, contactNumber);
  const contactLineHtml = contactLine ? `${escapeHtml(contactLine)} | ` : '';
  const contactLineText = contactLine ? `${contactLine} | ` : '';
  const instagramUrl =
    process.env.MAILER_INSTAGRAM_URL?.trim() || 'https://www.instagram.com/speedseriesph/';
  const facebookUrl =
    process.env.MAILER_FACEBOOK_URL?.trim() || 'https://www.facebook.com/PHathletesclub';
  const socialLinksHtml = `<a href="${escapeHtml(facebookUrl)}" style="color:#ea580c;">Facebook</a>`;
  const socialLinksText = `Facebook (${facebookUrl})`;
  const siteUrl = 'https://www.oneofakindasia.com';
  const preheader =
    'Your slot is secured. Next: race details, kit pickup, + Independence Day treats for early birds.';
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    siteUrl;

  const headerBanner = baseUrl
    ? `
    <div style="margin:0 0 20px 0;">
      <img src="${escapeHtml(baseUrl)}/images/2xu-event-mail-banner.jpg" alt="Speed Series — Powered by 2XU" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </div>
  `
    : '';

  const html = `
    <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    ${headerBanner}
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Congratulations — you&rsquo;re registered for Speed Series Baguio! 🇵🇭<br/>We&rsquo;re thrilled you&rsquo;ll be running with us in the City of Pines.</p>
    <div style="margin:20px 0; padding:16px; background:#f0fdf4; border-radius:8px; border:1px solid #86efac;">
      <p style="margin:0 0 12px 0; font-weight:bold; color:#166534; font-size:13px; letter-spacing:0.05em;">YOUR REGISTRATION CONFIRMED</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Event:</strong> Speed Series Baguio</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Date:</strong> Saturday, July 26, 2026</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Bib #:</strong> ${escapeHtml(bibLabel)}</p>
      <p style="margin:0; font-size:14px; color:#374151;"><strong>Order #:</strong> ${escapeHtml(orderLabel)}</p>
    </div>
    <p><strong>Save this email.</strong> It&rsquo;s your proof of registration.</p>
    <p style="margin:24px 0 8px 0; font-weight:bold; color:#1f2937;">WHAT HAPPENS NEXT</p>
    <p style="margin:0 0 16px 0;"><strong>1. Race Kit &amp; Independence Day Treat</strong><br/>
    If you registered June 12&ndash;14 and were among the first 100 per category, you unlocked our Independence Day Treat:<br/>
    2XU Aero Apparel + Your choice of bonus gear: Visor, Cap, OR 2XU Speed Belt.<br/>
    We&rsquo;ll send your &ldquo;Choose Your Gear&rdquo; email separately. If you registered after June 14, your kit follows the standard entitlement.</p>
    <p style="margin:0 0 16px 0;"><strong>2. Kit Pickup Details</strong><br/>
    Date + venue + schedule will be sent via email 7 days before race day. Please bring a valid ID + this confirmation email.</p>
    <p style="margin:0 0 16px 0;"><strong>3. Race Briefing</strong><br/>
    Course map, hydration points, cut-off times, and safety reminders will be emailed on July 19. We&rsquo;ll also post updates at <a href="${escapeHtml(instagramUrl)}" style="color:#ea580c;">@SpeedSeriesPH</a>.</p>
    <p style="margin:0 0 16px 0;"><strong>4. Train with Us</strong><br/>
    Coach Dan Brown will share weekly prep tips leading to race day. Watch your inbox.</p>
    <p style="margin:24px 0 8px 0; font-weight:bold; color:#1f2937;">IMPORTANT REMINDERS</p>
    <ol style="margin:0 0 20px 0; padding-left:20px; color:#374151;">
      <li style="margin-bottom:6px;">Slots are non-transferable and non-refundable.</li>
      <li style="margin-bottom:6px;">Race day registration is not available. All entries must be done online.</li>
      <li style="margin-bottom:0;">For concerns, reply to this email or message us at ${socialLinksHtml}. We reply within 24 hours.</li>
    </ol>
    <p>${escapeHtml(firstName)}, thank you for saying yes to the challenge. Baguio&rsquo;s elevation is tough, but the view — and the finish line feeling — is worth every step.</p>
    <p>This July 26, let&rsquo;s run free. See you at the start line.</p>
    <p>Run free,<br/><strong>Team Speed Series</strong><br/><a href="${siteUrl}">oneofakindasia.com</a><br/>${contactLineHtml}<a href="${escapeHtml(instagramUrl)}" style="color:#ea580c;">@SpeedSeriesPH</a></p>
    <p style="margin-top:20px; font-size:14px; color:#6b7280;"><em>P.S. Bring your running buddies. The Cordillera is better shared. Final slots for July 26 are moving fast → <a href="${siteUrl}" style="color:#ea580c;">www.oneofakindasia.com</a></em></p>
  `;

  const plainBody = `${preheader}

Hi ${firstName},

Congratulations — you're registered for Speed Series Baguio! 🇵🇭
We're thrilled you'll be running with us in the City of Pines.

YOUR REGISTRATION CONFIRMED
Event: Speed Series Baguio
Date: Saturday, July 26, 2026
Category: ${categoryLabel}
Bib #: ${bibLabel}
Order #: ${orderLabel}

Save this email. It's your proof of registration.

WHAT HAPPENS NEXT

1. Race Kit & Independence Day Treat
If you registered June 12-14 and were among the first 100 per category, you unlocked our Independence Day Treat:
2XU Aero Apparel + Your choice of bonus gear: Visor, Cap, OR 2XU Speed Belt.
We'll send your "Choose Your Gear" email separately. If you registered after June 14, your kit follows the standard entitlement.

2. Kit Pickup Details
Date + venue + schedule will be sent via email 7 days before race day. Please bring a valid ID + this confirmation email.

3. Race Briefing
Course map, hydration points, cut-off times, and safety reminders will be emailed on July 19. We'll also post updates at @SpeedSeriesPH.

4. Train with Us
Coach Dan Brown will share weekly prep tips leading to race day. Watch your inbox.

IMPORTANT REMINDERS
1. Slots are non-transferable and non-refundable.
2. Race day registration is not available. All entries must be done online.
3. For concerns, reply to this email or message us at ${socialLinksText}. We reply within 24 hours.

${firstName}, thank you for saying yes to the challenge. Baguio's elevation is tough, but the view — and the finish line feeling — is worth every step.

This July 26, let's run free. See you at the start line.

Run free,
Team Speed Series
${siteUrl}
${contactLineText}@SpeedSeriesPH

P.S. Bring your running buddies. The Cordillera is better shared. Final slots for July 26 are moving fast → ${siteUrl}`;

  const subject = 'You\u2019re Officially In! \uD83C\uDF89 Speed Series Baguio - July 26, 2026';

  return {
    subject,
    html,
    text: `Speed Series — Powered by 2XU\n\n${plainBody}`,
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
