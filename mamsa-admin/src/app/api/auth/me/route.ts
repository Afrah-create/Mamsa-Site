import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    const unauthenticatedResponse = NextResponse.json(
      { error: 'Unauthenticated' },
      { status: 401 }
    );
    unauthenticatedResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    unauthenticatedResponse.headers.set('Pragma', 'no-cache');
    unauthenticatedResponse.headers.set('Expires', '0');
    return unauthenticatedResponse;
  }

  const authenticatedResponse = NextResponse.json({ user: session }, { status: 200 });
  authenticatedResponse.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  authenticatedResponse.headers.set('Pragma', 'no-cache');
  authenticatedResponse.headers.set('Expires', '0');
  return authenticatedResponse;
}
