import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import {
  computeRegistrationPaymentAmount,
  formatRaceCategoryLabel,
} from '@/lib/registrationPaymentAmount';
import { formatDistanceCategoryLabel } from '@/lib/generateBibNumber';

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

function formatMailerContactLine(contactName: string, contactNumber: string): string {
  const parts = [contactName, contactNumber].map((part) => part.trim()).filter(Boolean);
  return parts.join(' — ');
}

export const REGISTRATION_ADMIN_CC = ['1@oneofakindasia.com'] as const;

export function isAdvocatePromoCode(promoCode: string): boolean {
  return /^SPS2XU\d+$/i.test(promoCode.trim());
}

type PaymentProofNotificationInput = {
  paymentProofSent?: boolean;
  paymentProofUrl?: string;
  promoCode?: string;
};

export function getRegistrationNotificationCc(primaryTo: string): string[] {
  const normalizedTo = primaryTo.trim().toLowerCase();
  return REGISTRATION_ADMIN_CC.filter((cc) => cc.toLowerCase() !== normalizedTo);
}

export function buildPaymentProofAdminNotificationHtml({
  paymentProofSent = false,
  paymentProofUrl = '',
  promoCode = '',
}: PaymentProofNotificationInput): string {
  const url = paymentProofUrl.trim();

  if (url) {
    return `
      <div style="margin:16px 0; padding:12px 16px; background:#f0fdf4; border:1px solid #86efac; border-radius:8px;">
        <p style="margin:0 0 8px 0; font-weight:bold; color:#166534;">Payment details</p>
        <p style="margin:0 0 8px 0;"><strong>Status:</strong> Uploaded image</p>
        <p style="margin:0;"><a href="${escapeHtml(url)}">View payment proof</a></p>
        <p style="margin:8px 0 0 0;"><img src="${escapeHtml(url)}" alt="Payment proof" width="280" style="max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:6px;" /></p>
      </div>
    `;
  }

  if (paymentProofSent) {
    return `
      <div style="margin:16px 0; padding:12px 16px; background:#eff6ff; border:1px solid #93c5fd; border-radius:8px;">
        <p style="margin:0 0 8px 0; font-weight:bold; color:#1e40af;">Payment details</p>
        <p style="margin:0;"><strong>Status:</strong> Proof of payment sent thru email</p>
      </div>
    `;
  }

  const statusText = isAdvocatePromoCode(promoCode) ? 'Advocate code — no payment required' : 'No payment';

  return `
    <div style="margin:16px 0; padding:12px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
      <p style="margin:0 0 8px 0; font-weight:bold; color:#374151;">Payment details</p>
      <p style="margin:0;"><strong>Status:</strong> ${escapeHtml(statusText)}</p>
    </div>
  `;
}

function buildPaymentProofConfirmationLine({
  paymentProofSent = false,
  paymentProofUrl = '',
  promoCode = '',
}: PaymentProofNotificationInput): { html: string; text: string } {
  const url = paymentProofUrl.trim();

  if (url) {
    return {
      html: `<p style="margin:8px 0 0 0; font-size:14px; color:#374151;"><strong>Payment proof:</strong> Uploaded image</p>`,
      text: 'Payment proof: Uploaded image',
    };
  }

  if (paymentProofSent) {
    return {
      html: `<p style="margin:8px 0 0 0; font-size:14px; color:#374151;"><strong>Payment proof:</strong> Sent thru email</p>`,
      text: 'Payment proof: Sent thru email',
    };
  }

  if (isAdvocatePromoCode(promoCode)) {
    return {
      html: `<p style="margin:8px 0 0 0; font-size:14px; color:#374151;"><strong>Payment:</strong> Advocate code</p>`,
      text: 'Payment: Advocate code',
    };
  }

  return { html: '', text: '' };
}

export function shouldSendConfirmedRegistrationEmail(
  promoCode: string,
  paymentProofSent = false,
  paymentProofUrl = ''
): boolean {
  return (
    isAdvocatePromoCode(promoCode) ||
    paymentProofSent === true ||
    paymentProofUrl.trim().length > 0
  );
}

export function buildRegistrationConfirmationEmail({
  participantName,
  promoCode = '',
  raceCategory = '',
  speedDistance = '',
  paymentProofSent = false,
  paymentProofUrl = '',
  orderNumber = '',
  bibNumber = '',
}: BuildRegistrationConfirmationEmailInput): RegistrationConfirmationEmailPreview {
  const sendConfirmed = shouldSendConfirmedRegistrationEmail(
    promoCode,
    paymentProofSent,
    paymentProofUrl
  );

  if (sendConfirmed) {
    return buildConfirmedRegistrationEmail({
      participantName,
      speedDistance,
      orderNumber,
      bibNumber,
      paymentProofSent,
      paymentProofUrl,
      promoCode,
    });
  }

  return buildPaymentPendingRegistrationEmail({
    participantName,
    promoCode,
    raceCategory,
    speedDistance,
  });
}

function buildConfirmedRegistrationEmail({
  participantName,
  speedDistance = '',
  orderNumber = '',
  bibNumber = '',
  paymentProofSent = false,
  paymentProofUrl = '',
  promoCode = '',
}: {
  participantName: string;
  speedDistance?: string;
  orderNumber?: string;
  bibNumber?: string;
  paymentProofSent?: boolean;
  paymentProofUrl?: string;
  promoCode?: string;
}): RegistrationConfirmationEmailPreview {
  const firstName = getFirstName(participantName);
  const categoryLabel = formatDistanceCategoryLabel(speedDistance);
  const orderLabel = formatOrderNumber(orderNumber);
  const bibLabel = '(to follow)';
  const contactName = process.env.MAILER_CONTACT_NAME?.trim() || 'Pinkee';
  const contactNumber = process.env.MAILER_CONTACT_NUMBER?.trim() || '09053162845';
  const contactLine = formatMailerContactLine(contactName, contactNumber);
  const contactLineHtml = contactLine ? `${escapeHtml(contactLine)} | ` : '';
  const contactLineText = contactLine ? `${contactLine} | ` : '';
  const instagramUrl =
    process.env.MAILER_INSTAGRAM_URL?.trim() || 'https://www.instagram.com/speedseriesph/';
  const facebookUrl =
    process.env.MAILER_FACEBOOK_URL?.trim() ||
    'https://web.facebook.com/profile.php?id=100079108505043';
  const siteUrl = 'https://www.oneofakindasia.com';
  const paymentProofLine = buildPaymentProofConfirmationLine({
    paymentProofSent,
    paymentProofUrl,
    promoCode,
  });
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
      <p style="margin:0 0 6px 0; font-size:14px; color:#374151;"><strong>Order #:</strong> ${escapeHtml(orderLabel)}</p>
      ${paymentProofLine.html}
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
      <li style="margin-bottom:0;">For concerns, reply to this email or message us at <a href="${escapeHtml(facebookUrl)}" style="color:#ea580c;">Facebook</a>. We reply within 24 hours.</li>
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
${paymentProofLine.text ? `${paymentProofLine.text}\n` : ''}
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
3. For concerns, reply to this email or message us at Facebook. We reply within 24 hours.

${firstName}, thank you for saying yes to the challenge. Baguio's elevation is tough, but the view — and the finish line feeling — is worth every step.

This July 26, let's run free. See you at the start line.

Run free,
Team Speed Series
${siteUrl}
${contactLineText}@SpeedSeriesPH

P.S. Bring your running buddies. The Cordillera is better shared. Final slots for July 26 are moving fast → ${siteUrl}`;

  return {
    subject: 'You\u2019re Officially In! \uD83C\uDF89 Speed Series Baguio - July 26, 2026',
    html,
    text: `Speed Series — Powered by 2XU\n\n${plainBody}`,
  };
}

function buildPaymentPendingRegistrationEmail({
  participantName,
  promoCode = '',
  raceCategory = '',
  speedDistance = '',
}: {
  participantName: string;
  promoCode?: string;
  raceCategory?: string;
  speedDistance?: string;
}): RegistrationConfirmationEmailPreview {
  const signOffName =
    process.env.SMTP_SIGNOFF_NAME?.trim() || 'One of a Kind Asia';
  const siteUrl = 'https://www.oneofakindasia.com';
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

  const paymentSection = `
    <div style="margin-top:24px; padding:16px; background:#fef3e2; border-radius:8px; border:1px solid #f59e0b;">
      <p style="margin:0 0 12px 0; font-weight:bold; color:#1f2937;">Payment options – scan to pay</p>
      <p style="margin:0 0 16px 0; font-size:14px; color:#4b5563;">Send proof of payment to 1@oneofakindasia.com to confirm your slot.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:16px; vertical-align:top;">
            <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#374151;">GCash</p>
            <p style="margin:0 0 8px 0; font-size:12px; color:#6b7280;">GCash QR Code</p>
            <img src="${escapeHtml(baseUrl)}/images/payment-options/gcash.jpg" alt="GCash QR Code" width="180" height="180" style="display:block; border-radius:8px;" />
          </td>
          <td style="vertical-align:top;">
            <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#374151;">Gotyme Bank Transfer</p>
            <p style="margin:0 0 8px 0; font-size:12px; color:#6b7280;">Bank Transfer QR Code</p>
            <img src="${escapeHtml(baseUrl)}/images/payment-options/bank-transfer.jpg" alt="Bank Transfer QR Code" width="180" height="180" style="display:block; border-radius:8px;" />
          </td>
        </tr>
      </table>
    </div>
  `;

  const paymentAmount = raceCategory
    ? computeRegistrationPaymentAmount(raceCategory, promoCode, speedDistance)
    : null;
  const raceExperienceLabel = raceCategory
    ? formatRaceCategoryLabel(raceCategory, speedDistance)
    : '';
  const amountDuePhp = paymentAmount
    ? paymentAmount.phpAmount.toLocaleString('en-PH')
    : '';
  const amountDueHtml = paymentAmount
    ? `
    <div style="margin-top:16px; padding:14px; background:#fffbeb; border-radius:8px; border:1px solid #fbbf24;">
      <p style="margin:0 0 8px 0; font-weight:bold; color:#92400e;">Amount to pay</p>
      ${
        raceExperienceLabel
          ? `<p style="margin:0 0 8px 0; font-size:14px; color:#374151;">Race experience: <strong>${escapeHtml(
              raceExperienceLabel
            )}</strong></p>`
          : ''
      }
      <p style="margin:0; font-size:15px; color:#1f2937;">Please remit <strong>Php ${escapeHtml(
        amountDuePhp
      )}</strong> (approx. ${escapeHtml(paymentAmount.usdDisplay)} USD).</p>
      ${
        paymentAmount.promoCodeLabel
          ? `<p style="margin:8px 0 0 0; font-size:14px; color:#065f46;">Promo applied: <strong>${escapeHtml(
              paymentAmount.promoCodeLabel
            )}</strong>.</p>`
          : ''
      }
    </div>
  `
    : '';
  const amountDueText = paymentAmount
    ? `Amount to pay${
        raceExperienceLabel ? ` (${raceExperienceLabel})` : ''
      }: Php ${amountDuePhp} (approx. ${paymentAmount.usdDisplay} USD).${
        paymentAmount.promoCodeLabel ? ` Promo applied: ${paymentAmount.promoCodeLabel}.` : ''
      }\n\n`
    : '';

  const html = `
    ${headerBanner}
    <p>Dear ${escapeHtml(participantName)},</p>
    <p>Thank you for your interest in taking part in the Speed Series powered by 2XU—the ultimate urban run performance and advocacy event. We have successfully received your registration details.</p>
    <p>You&rsquo;re now one step closer to the starting line. To complete your registration, please proceed with your preferred payment option and send your proof of payment to Speed Series for verification.</p>
    ${amountDueHtml}
    <p>Stay tuned for your final confirmation.</p>
    <p>Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit <a href="https://www.oneofakindasia.com">www.oneofakindasia.com</a> for official event details.</p>
    ${paymentSection}
    <p>We can&rsquo;t wait to see you at the starting line.<br/>Let&rsquo;s make history.</p>
    <p>🔥 Mission Strong<br/>⚡ Speed Series<br/>Powered by 2XU</p>
    <p>Let&rsquo;s go.</p>
    <p>Warm regards,<br/>${escapeHtml(signOffName)}</p>
    <p><a href="https://www.oneofakindasia.com">www.oneofakindasia.com</a></p>
  `;

  const textPayment =
    'Payment options – scan to pay. Send proof of payment to 1@oneofakindasia.com to confirm your slot. (GCash and Gotyme Bank Transfer QR codes are in the HTML version of this email.)\n\n';

  const plainBody = `Dear ${participantName},

Thank you for your interest in taking part in the Speed Series powered by 2XU—the ultimate urban run performance and advocacy event. We have successfully received your registration details.

You're now one step closer to the starting line. To complete your registration, please proceed with your preferred payment option and send your proof of payment to Speed Series for verification.

${amountDueText}Stay tuned for your final confirmation.

Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit www.oneofakindasia.com for official event details.

${textPayment}We can't wait to see you at the starting line.
Let's make history.

🔥 Mission Strong
⚡ Speed Series
Powered by 2XU

Let's go.

Warm regards,
${signOffName}
${siteUrl}`;

  return {
    subject: 'Speed Series powered by 2XU — Registration received',
    html,
    text: `Speed Series — Powered by 2XU\n\n${plainBody}`,
  };
}

export type SendRegistrationConfirmationOptions = {
  promoCode?: string;
  raceCategory?: string;
  speedDistance?: string;
  paymentProofSent?: boolean;
  paymentProofUrl?: string;
  orderNumber?: string;
  bibNumber?: string;
};

export async function sendRegistrationConfirmation(
  participantName: string,
  participantEmail: string,
  options: SendRegistrationConfirmationOptions = {}
): Promise<MailerSendResult> {
  const {
    promoCode = '',
    raceCategory = '',
    speedDistance = '',
    paymentProofSent = false,
    paymentProofUrl = '',
    orderNumber = '',
    bibNumber = '',
  } = options;

  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || from;

  const preview = buildRegistrationConfirmationEmail({
    participantName,
    promoCode,
    raceCategory,
    speedDistance,
    paymentProofSent,
    paymentProofUrl,
    orderNumber,
    bibNumber,
  });

  const ccRecipients = [...REGISTRATION_ADMIN_CC, 'ops@oneofakindasia.com'];

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
