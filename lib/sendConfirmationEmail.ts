import nodemailer from 'nodemailer';

/**
 * Sends the registration confirmation email to the participant.
 * Uses SMTP env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 * Best-effort; does not throw (logs and returns false on failure).
 */
export async function sendRegistrationConfirmation(
  participantName: string,
  participantEmail: string
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

  const html = `
    <p>Dear ${escapeHtml(participantName)},</p>
    <p>Thank you for registering with us.</p>
    <p>We have received your registration. However, please note that your registration will only be confirmed upon receipt of payment.</p>
    <p>Kindly complete your payment at your earliest convenience to secure your slot. Once payment has been verified, we will send you a confirmation email with the next details.</p>
    <p>If you have any questions or need assistance, feel free to reply to this email.</p>
    <p>Thank you, and we look forward to having you with us.</p>
    <p>Best regards,<br/>
    Tin Majadillas<br/>
    One of a kind Asia<br/>
    +63 905 316 2845</p>
  `;

  try {
    await transporter.sendMail({
      from,
      to: participantEmail,
      subject: '2XU Speed Run – Registration Received',
      html,
      text: `Dear ${participantName},\n\nThank you for registering with us.\n\nWe have received your registration. However, please note that your registration will only be confirmed upon receipt of payment.\n\nKindly complete your payment at your earliest convenience to secure your slot. Once payment has been verified, we will send you a confirmation email with the next details.\n\nIf you have any questions or need assistance, feel free to reply to this email.\n\nThank you, and we look forward to having you with us.\n\nBest regards,\nTin Majadillas\nOne of a kind Asia\n+63 905 316 2845`,
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
