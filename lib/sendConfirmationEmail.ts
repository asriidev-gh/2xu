import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Sends the registration confirmation email to the participant.
 * Uses SMTP env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 * Optional: SMTP_SIGNOFF_NAME (defaults to "One of a Kind Asia") for "Warm regards" line.
 * Best-effort; does not throw (logs and returns false on failure).
 * @param tShirtSizeInfo - Optional: "M" for individual, or "Team T-shirt sizes: M, L, XL, S" for team.
 */
type MailerSendResult = { success: true; error: null } | { success: false; error: string };

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

export async function sendRegistrationConfirmation(
  participantName: string,
  participantEmail: string,
  tShirtSizeInfo?: string,
  useLegacyTemplate = false,
  promoCode = ''
): Promise<MailerSendResult> {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || from;
  const signOffName =
    process.env.SMTP_SIGNOFF_NAME?.trim() || 'One of a Kind Asia';

  // CC internal organizers on every registration confirmation
  const ccRecipients = [
    'oneofakindasiaph@gmail.com',
    'ops@oneofakindasia.com',
    '1@oneofakindasia.com',
  ];

  const siteUrl = 'https://www.oneofakindasia.com';
  // Base URL for payment QR images in email
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
  const normalizedPromoCode = promoCode.trim().toUpperCase();
  const isSpecialPromoCode = /^SPSUAAPELITE\d+$/i.test(normalizedPromoCode);
  const isMissionStrongPromoCode = normalizedPromoCode === 'MISSIONSTRONG500';
  const promoPaymentSummary = isSpecialPromoCode
    ? { codeLabel: normalizedPromoCode || 'SPSUAAPElite', payableAmount: '995' }
    : isMissionStrongPromoCode
      ? { codeLabel: 'MISSIONSTRONG500', payableAmount: '1300' }
      : null;
  const promoPaymentHtml = promoPaymentSummary
    ? `
    <div style="margin-top:16px; padding:14px; background:#ecfdf5; border-radius:8px; border:1px solid #10b981;">
      <p style="margin:0 0 8px 0; font-weight:bold; color:#065f46;">Special Promo Applied: ${escapeHtml(
        promoPaymentSummary.codeLabel
      )}</p>
      <p style="margin:0; font-size:14px; color:#065f46;">Your payable amount is <strong>Php ${escapeHtml(
        promoPaymentSummary.payableAmount
      )}</strong>.</p>
    </div>
  `
    : '';

  const htmlLegacy = `
    ${headerBanner}
    <p>Dear ${escapeHtml(participantName)},</p>
    <p>Congratulations! 🎉</p>
    <p>Your registration for the Exclusive Speed Series Pre-Registration is officially confirmed — and you are now part of something powerful.</p>
    <p>As one of our early VIP athletes, you will receive your exclusive VIP Race Kit during our Race Kit Pick-Up on May 15–16. Get ready to gear up, show up, and level up.</p>
    <p>This is more than a race.<br/>This is Speed. Strength. Legacy.</p>
    ${promoPaymentHtml}
    <p>Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit <a href="https://www.oneofakindasia.com">www.oneofakindasia.com</a> for official event details.</p>
    <p>We can&rsquo;t wait to see you at the starting line.<br/>Let&rsquo;s make history.</p>
    <p>🔥 Mission Strong<br/>⚡ Speed Series<br/>Powered by 2XU</p>
  `;
  const htmlNew = `
    ${headerBanner}
    <p>Dear ${escapeHtml(participantName)},</p>
    <p>Thank you for your interest in taking part in the Speed Series powered by 2XU—the ultimate urban run performance and advocacy event. We have successfully received your registration details.</p>
    <p>You&rsquo;re now one step closer to the starting line. To complete your registration, please proceed with your preferred payment option and send your proof of payment to Speed Series for verification.</p>
    <p>Stay tuned for your final confirmation.</p>
    <p>Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit <a href="https://www.oneofakindasia.com">www.oneofakindasia.com</a> for official event details.</p>
    ${paymentSection}
    ${promoPaymentHtml}
    <p>We can&rsquo;t wait to see you at the starting line.<br/>Let&rsquo;s make history.</p>
    <p>🔥 Mission Strong<br/>⚡ Speed Series<br/>Powered by 2XU</p>
    <p>Let&rsquo;s go.</p>
    <p>Warm regards,<br/>${escapeHtml(signOffName)}</p>
    <p><a href="https://www.oneofakindasia.com">www.oneofakindasia.com</a></p>
  `;
  const html = useLegacyTemplate ? htmlLegacy : htmlNew;

  const textPayment =
    'Payment options – scan to pay. Send proof of payment to 1@oneofakindasia.com to confirm your slot. (GCash and Gotyme Bank Transfer QR codes are in the HTML version of this email.)\n\n';
  const promoPaymentText = promoPaymentSummary
    ? `Special promo applied: ${promoPaymentSummary.codeLabel}.\nYour payable amount is Php ${promoPaymentSummary.payableAmount}.\n\n`
    : '';
  const plainBodyLegacy = `Dear ${participantName},

Congratulations! 🎉

Your registration for the Exclusive Speed Series Pre-Registration is officially confirmed — and you are now part of something powerful.

As one of our early VIP athletes, you will receive your exclusive VIP Race Kit during our Race Kit Pick-Up on May 8–10. Get ready to gear up, show up, and level up.

This is more than a race.
This is Speed. Strength. Legacy.

${promoPaymentText}
Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit www.oneofakindasia.com for official event details.

We can't wait to see you at the starting line.
Let's make history.

🔥 Mission Strong
⚡ Speed Series
Powered by 2XU`;
  const plainBodyNew = `Dear ${participantName},

Thank you for your interest in taking part in the Speed Series powered by 2XU—the ultimate urban run performance and advocacy event. We have successfully received your registration details.

You're now one step closer to the starting line. To complete your registration, please proceed with your preferred payment option and send your proof of payment to Speed Series for verification.

Stay tuned for your final confirmation.

Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit www.oneofakindasia.com for official event details.

${textPayment}${promoPaymentText}We can't wait to see you at the starting line.
Let's make history.

🔥 Mission Strong
⚡ Speed Series
Powered by 2XU

Let's go.

Warm regards,
${signOffName}
${siteUrl}`;
  const plainBody = useLegacyTemplate ? plainBodyLegacy : plainBodyNew;
  const subject = 'Speed Series powered by 2XU — Registration received';

  // Prefer Resend when configured (requested by user). No SMTP fallback in this mode.
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { error } = await resend.emails.send({
        from: resendFrom,
        to: [participantEmail],
        cc: ccRecipients,
        subject,
        html,
        text: `Speed Series — Powered by 2XU\n\n${plainBody}`,
      });
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      console.log('[sendConfirmationEmail] Confirmation email sent via Resend to', participantEmail);
      return { success: true, error: null };
    } catch (err) {
      console.error('[sendConfirmationEmail] Resend failed:', err);
      return { success: false, error: formatResendError(err) };
    }
  }

  if (!host || !port || !user || !pass) {
    console.warn(
      '[sendConfirmationEmail] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local'
    );
    return {
      success: false,
      error: 'SMTP not configured',
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
      subject,
      html,
      text: `Speed Series — Powered by 2XU\n\n${plainBody}`,
    });
    console.log('[sendConfirmationEmail] Confirmation email sent to', participantEmail);
    return { success: true, error: null };
  } catch (err) {
    console.error('[sendConfirmationEmail] Failed to send:', err);
    return {
      success: false,
      error: formatMailerError(err),
    };
  }
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
