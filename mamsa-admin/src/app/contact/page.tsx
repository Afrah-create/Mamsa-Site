'use client';

import { useEffect, useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';

interface ContactSettings {
  id: number;
  office_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  map_embed_url: string | null;
}

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const DEFAULT_FORM: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};


export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [formState, setFormState] = useState<ContactFormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const response = await fetch('/api/contact/settings');
        if (!response.ok) {
          throw new Error('Failed to load contact settings');
        }
        const payload = await response.json();
        setSettings(payload.data ?? null);
      } catch (error) {
        console.error(error);
        setToast({
          type: 'error',
          message: 'We could not load the latest office details. Please try again shortly.',
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (field: keyof ContactFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setToast(null);

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit your message right now.');
      }

      setFormState(DEFAULT_FORM);
      setToast({ type: 'success', message: 'We received your message and will get back to you soon.' });
    } catch (error) {
      console.error(error);
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error sending your message.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);


  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PublicNavbar />
      <main className="flex-1 pt-24">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src="/images/IMG_4217.jpg"
              alt="MAMSA Contact"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/80 via-emerald-600/75 to-emerald-500/80" />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12 text-center sm:px-8 md:px-10 lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">Get in touch</p>
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">We&apos;d Love to Hear From You</h1>
            <p className="mx-auto max-w-2xl text-sm text-emerald-50/90 sm:text-base">
              Whether you&apos;re a prospective member, partner, or alumnus, our team is ready to help. Send us a message and
              we&apos;ll connect you with the right administrator.
            </p>
          </div>
        </section>

        {toast && (
          <div
            className={`mx-auto mt-6 max-w-3xl rounded-xl border px-4 py-3 text-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {toast.message}
          </div>
        )}

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:px-8 lg:grid-cols-[1fr,1fr] lg:gap-12">
          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="border-b border-emerald-50 px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900">Send a Message</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Fill out the form and our administrators will reach out as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      maxLength={200}
                      value={formState.name}
                      onChange={handleInputChange('name')}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      maxLength={200}
                      value={formState.email}
                      onChange={handleInputChange('email')}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="jane.doe@email.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formState.phone}
                      onChange={handleInputChange('phone')}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject *
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      maxLength={200}
                      value={formState.subject}
                      onChange={handleInputChange('subject')}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Share your question or topic"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    rows={6}
                    value={formState.message}
                    onChange={handleInputChange('message')}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
                <p className="text-xs text-gray-500">
                  We will only use your information to respond to your enquiry.
                </p>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-emerald-800">Visit Us</h2>
                <p className="mt-2 text-sm text-emerald-900/80 leading-relaxed">
                  {loadingSettings
                    ? 'Loading office details…'
                    : settings?.address || 'Our office details will be available soon.'}
                </p>

                <dl className="mt-4 space-y-3 text-sm text-emerald-900/80">
                  {settings?.office_name && (
                    <div>
                      <dt className="font-semibold text-emerald-700">Office</dt>
                      <dd>{settings.office_name}</dd>
                    </div>
                  )}
                  {settings?.email && (
                    <div>
                      <dt className="font-semibold text-emerald-700">Email</dt>
                      <dd>
                        <a href={`mailto:${settings.email}`} className="text-emerald-700 hover:text-emerald-800">
                          {settings.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {settings?.phone && (
                    <div>
                      <dt className="font-semibold text-emerald-700">Phone</dt>
                      <dd>
                        <a href={`tel:${settings.phone}`} className="text-emerald-700 hover:text-emerald-800">
                          {settings.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

