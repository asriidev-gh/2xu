import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service is not configured. Please set RESEND_API_KEY in .env.local' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : '';
    const email = body.email != null ? String(body.email).trim() : '';
    const contact = body.contact != null ? String(body.contact).trim() : '';
    const message = body.message != null ? String(body.message).trim() : '';

    if (!name || !email || !contact || !message) {
      return NextResponse.json(
        { error: 'Name, email, contact number, and message are required' },
        { status: 400 }
      );
    }

    const to = process.env.DEVELOPER_CONTACT_TO?.trim() || 'asriidev@gmail.com';
    const from =
      process.env.DEVELOPER_CONTACT_FROM?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      '2XU Speed Run <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `Developer contact from ${name}`,
      html: `
        <h2>Developer contact form</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Contact number:</strong> ${escapeHtml(contact)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error('[developer-contact] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('[developer-contact] error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
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
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
