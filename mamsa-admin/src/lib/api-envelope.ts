import { NextResponse } from 'next/server';

type EnvelopeOptions<T> = {
  status?: number;
  data?: T;
  message?: string;
  error?: string;
};

/** `{ success, data?, message?, error? }` for admin/public API consistency. */
export function apiEnvelope<T = unknown>(success: boolean, options: EnvelopeOptions<T> = {}) {
  const status = options.status ?? (success ? 200 : 400);
  const body: Record<string, unknown> = { success };
  if (options.data !== undefined) body.data = options.data;
  if (options.message != null) body.message = options.message;
  if (options.error != null) body.error = options.error;
  return NextResponse.json(body, { status });
}
