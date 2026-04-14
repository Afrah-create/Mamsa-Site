import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname === '/admin-mamsa' ||
    pathname.startsWith('/api/admin')
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;
  const session = token ? await verifyJWT(token) : null;

  if (session) {
    return applyNoStoreHeaders(NextResponse.next());
  }

  if (pathname.startsWith('/api/admin')) {
    return applyNoStoreHeaders(
      NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    );
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|webp|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};