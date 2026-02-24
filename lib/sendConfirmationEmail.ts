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
    <p>Thank you for registering with us.</p>
    <p>We have received your registration. However, please note that your registration will only be confirmed upon receipt of payment.</p>
    ${tShirtSizeInfo ? `<p><strong>T-shirt size${tShirtSizeInfo.includes(',') ? 's' : ''}:</strong> ${escapeHtml(tShirtSizeInfo)}</p>` : ''}
    <p>Kindly complete your payment at your earliest convenience to secure your slot. Once payment has been verified, we will send you a confirmation email with the next details.</p>
    ${paymentSection}
    <p style="margin-top:20px;">If you have any questions or need assistance, feel free to reply to this email.</p>
    <p>Thank you, and we look forward to having you with us.</p>
    <p>Best regards,<br/>
    Tin Majadillas<br/>
    One of a kind Asia<br/>
    +63 905 316 2845</p>
  `;

  const textTShirtLine = tShirtSizeInfo ? `T-shirt size${tShirtSizeInfo.includes(',') ? 's' : ''}: ${tShirtSizeInfo}\n\n` : '';
  try {
    await transporter.sendMail({
      from,
      to: participantEmail,
      subject: '2XU Speed Run – Registration Received',
      html,
      text: `Dear ${participantName},\n\nThank you for registering with us.\n\nWe have received your registration. However, please note that your registration will only be confirmed upon receipt of payment.\n\n${textTShirtLine}Kindly complete your payment at your earliest convenience to secure your slot. Once payment has been verified, we will send you a confirmation email with the next details.\n\nPayment: Scan the QR codes in the HTML version of this email, or visit our registration page to view GCash and Gotyme Bank Transfer options. Send proof of payment to 1@oneofakindasia.com.\n\nIf you have any questions or need assistance, feel free to reply to this email.\n\nThank you, and we look forward to having you with us.\n\nBest regards,\nTin Majadillas\nOne of a kind Asia\n+63 905 316 2845`,
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
