import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase-server';

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

    const supabase = await createServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not configured.' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to persist contact message:', error);
      return NextResponse.json(
        { error: 'Unable to submit your message right now. Please try again later.' },
        { status: 500 }
      );
    }

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

