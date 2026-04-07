import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import sql from '@/lib/db';

const ADMIN_NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? 'notifications@mamsa.org';

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const sanitize = (value: string) => value.replace(/<[^>]+>/g, '').trim();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload;

    const name = sanitize(body.name ?? '');
    const email = sanitize(body.email ?? '');
    const phone = sanitize(body.phone ?? '');
    const subject = sanitize(body.subject ?? '');
    const message = (body.message ?? '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Please provide your name, email, subject, and message.' },
        { status: 400 }
      );
    }

    const rows = await sql<{
      id: number;
      name: string;
      email: string;
      phone: string | null;
      subject: string;
      message: string;
      status: string;
      created_at: string;
      updated_at: string | null;
    }[]>`
      INSERT INTO contact_messages (name, email, phone, subject, message, status)
      VALUES (${name}, ${email}, ${phone || null}, ${subject}, ${message}, 'new')
      RETURNING id, name, email, phone, subject, message, status, created_at, updated_at
    `;

    const data = rows[0] ?? null;

    // Send email notification if configuration is available
    if (RESEND_API_KEY && ADMIN_NOTIFICATION_EMAIL) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: ADMIN_NOTIFICATION_EMAIL.split(',').map((address) => address.trim()),
          subject: `New Contact Message: ${subject}`,
          text: [
            `You received a new message from ${name}.`,
            '',
            `Subject: ${subject}`,
            `Email: ${email}`,
            phone ? `Phone: ${phone}` : '',
            '',
            `Message:`,
            message,
            '',
            `View in admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/contact-management`,
          ]
            .filter(Boolean)
            .join('\n'),
        });
      } catch (emailError) {
        console.warn('Contact notification email failed:', emailError);
      }
    }

    return NextResponse.json({ success: true, message: 'Message received. Thank you!', data });
  } catch (err) {
    console.error('Unhandled contact submission error:', err);
    return NextResponse.json(
      { error: 'Unexpected error submitting your message.' },
      { status: 500 }
    );
  }
}

