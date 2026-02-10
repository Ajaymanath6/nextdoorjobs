import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/onboarding',
  '/api/auth/signin',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/callback(.*)',
  '/api/auth/callback/clerk(.*)',
  // Onboarding: auth enforced inside routes (Clerk or cookie via getCurrentUser)
  '/api/onboarding(.*)',
  // Map search and autocomplete (used before login)
  '/api/search-locality',
  '/api/localities',
  '/api/search-college',
  '/api/colleges',
  '/api/job-titles',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  // When app loads at root: unauthenticated users see onboarding (Clerk signup) first
  if (path === '/') {
    if (!userId) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
