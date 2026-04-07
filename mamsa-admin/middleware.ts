import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/login(.*)',
    '/community(.*)',
    '/contact(.*)',
    '/api/public(.*)',
    '/api/contact(.*)',
    '/api/auth(.*)',
  ],
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|webp|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};