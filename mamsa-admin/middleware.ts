import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

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
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|webp|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};