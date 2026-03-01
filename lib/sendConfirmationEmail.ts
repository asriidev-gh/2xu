import nodemailer from 'nodemailer';

/**
 * Sends the registration confirmation email to the participant.
 * Uses SMTP env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 * Best-effort; does not throw (logs and returns false on failure).
 * @param tShirtSizeInfo - Optional: "M" for individual, or "Team T-shirt sizes: M, L, XL, S" for team.
 */
export async function sendRegistrationConfirmation(
  participantName: string,
  participantEmail: string,
  tShirtSizeInfo?: string
): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || 'One of a kind Asia <ops@oneofakindasia.com>';

  if (!host || !port || !user || !pass) {
    console.warn(
      '[sendConfirmationEmail] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local'
    );
    return false;
  }

  const portNum = parseInt(port, 10);
  const secure = portNum === 465;

  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure,
    auth: { user, pass },
  });

  // Base URL for payment QR images in email (deployed site or localhost)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  const paymentSection =
    baseUrl
      ? `
    <div style="margin-top:24px; padding:16px; background:#fef3e2; border-radius:8px; border:1px solid #f59e0b;">
      <p style="margin:0 0 12px 0; font-weight:bold; color:#1f2937;">Payment options – scan to pay</p>
      <p style="margin:0 0 16px 0; font-size:14px; color:#4b5563;">Send proof of payment to 1@oneofakindasia.com to confirm your slot.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:16px; vertical-align:top;">
            <p style="margin:0 0 6px 0; font-size:13px; font-weight:600; color:#374151;">GCash</p>
            <img src="${escapeHtml(baseUrl)}/images/payment-options/gcash.jpg" alt="GCash QR Code" width="180" height="180" style="display:block; border-radius:8px;" />
          </td>
          <td style="vertical-align:top;">
            <p style="margin:0 0 6px 0; font-size:13px; font-weight:600; color:#374151;">Gotyme Bank Transfer</p>
            <img src="${escapeHtml(baseUrl)}/images/payment-options/bank-transfer.jpg" alt="Bank Transfer QR Code" width="180" height="180" style="display:block; border-radius:8px;" />
          </td>
        </tr>
      </table>
    </div>
  `
      : `
    <p style="margin-top:16px; font-size:14px; color:#6b7280;">To view payment QR codes, visit the registration page on our website.</p>
  `;

  const html = `
    <p>Dear ${escapeHtml(participantName)},</p>
    <p>Congratulations! 🎉</p>
    <p>Your registration for the Exclusive Speed Series Pre-Registration is officially confirmed — and you are now part of something powerful.</p>
    <p>As one of our early VIP athletes, you will receive your exclusive VIP Race Kit during our Race Kit Pick-Up on May 8–10. Get ready to gear up, show up, and level up.</p>
    <p>This is more than a race.<br/>This is Speed. Strength. Legacy.</p>
    <p>Stay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit <a href="https://www.oneofakindasia.com">www.oneofakindasia.com</a> for official event details.</p>
    ${paymentSection}
    <p>We can't wait to see you at the starting line.<br/>Let's make history.</p>
    <p>🔥 Mission Strong<br/>⚡ Speed Series<br/>Powered by 2XU</p>
    <p>+63 969 187 4689</p>
  `;

  const textPayment = baseUrl
    ? 'Payment: Scan the QR codes in the HTML version of this email, or visit our registration page to view GCash and Gotyme Bank Transfer options. Send proof of payment to 1@oneofakindasia.com.\n\n'
    : 'Payment: Visit our registration page to view payment options. Send proof of payment to 1@oneofakindasia.com.\n\n';
  try {
    await transporter.sendMail({
      from,
      to: participantEmail,
      subject: 'Exclusive Speed Series Pre-Registration – You\'re Confirmed',
      html,
      text: `Dear ${participantName},\n\nCongratulations! 🎉\n\nYour registration for the Exclusive Speed Series Pre-Registration is officially confirmed — and you are now part of something powerful.\n\nAs one of our early VIP athletes, you will receive your exclusive VIP Race Kit during our Race Kit Pick-Up on May 8–10. Get ready to gear up, show up, and level up.\n\nThis is more than a race.\nThis is Speed. Strength. Legacy.\n\nStay locked in for updates and exciting announcements via the Mission Strong Speed Series Facebook page and visit www.oneofakindasia.com for official event details.\n\n${textPayment}We can't wait to see you at the starting line.\nLet's make history.\n\n🔥 Mission Strong\n⚡ Speed Series\nPowered by 2XU`,
    });
    console.log('[sendConfirmationEmail] Confirmation email sent to', participantEmail);
    return true;
  } catch (err) {
    console.error('[sendConfirmationEmail] Failed to send:', err);
    return false;
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
