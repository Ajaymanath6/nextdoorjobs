import { clerkMiddleware, createRouteMatcher, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from './lib/prisma';

/** Proxy Frontend API requests to Clerk so custom domain (clerk.mapmygig.com) is not required. */
function clerkFapiProxy(req: Request) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/__clerk')) return null;

  const secretKey = process.env.CLERK_SECRET_KEY || '';
  if (!secretKey) return null;

  // Derive proxy URL from request if not explicitly set
  let proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || '';
  if (!proxyUrl) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    proxyUrl = `${baseUrl.replace(/\/$/, '')}/__clerk`;
  }

  const proxyHeaders = new Headers(req.headers);
  proxyHeaders.set('Clerk-Proxy-Url', proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl);
  proxyHeaders.set('Clerk-Secret-Key', secretKey);
  const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  proxyHeaders.set('X-Forwarded-For', forwardedFor);

  const target = new URL(req.url);
  target.host = 'frontend-api.clerk.dev';
  target.port = '443';
  target.protocol = 'https:';
  target.pathname = target.pathname.replace(/^\/__clerk/, '') || '/';

  return NextResponse.rewrite(target, { request: { headers: proxyHeaders } });
}

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/onboarding',
  '/onboarding.org',
  '/who-are-you',
  '/api/auth/signin',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
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

const clerkHandler = clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();
    const path = req.nextUrl.pathname;

    // When app loads at root: unauthenticated users see onboarding; signed-in users check accountType
    if (path === '/') {
      if (!userId) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
      // Only redirect to who-are-you when we have confirmed the user has no accountType. Otherwise allow through so existing users are not shown who-are-you.
      try {
        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (!clerkUser || !email) {
          // Clerk not ready or no email: allow through; do not redirect (avoids showing who-are-you to existing users)
          return NextResponse.next();
        }
        const emailNorm = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: emailNorm },
          select: { accountType: true },
        });
        // Only allow through to map when accountType is explicitly set (Individual or Company)
        const hasAccountType = user?.accountType === 'Individual' || user?.accountType === 'Company';
        if (hasAccountType) {
          return NextResponse.next();
        }
        // User in DB but no accountType, or user not in DB yet -> who-are-you first
        return NextResponse.redirect(new URL('/who-are-you', req.url));
      } catch (err) {
        // On error, allow through so we never block users who already have accountType
        console.error("[proxy] Error checking accountType:", err instanceof Error ? err.message : String(err));
        return NextResponse.next();
      }
    }

    // Protect all other routes except public ones
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    return NextResponse.next();
  } catch (err) {
    // If Clerk fails (e.g. missing/invalid keys on Vercel), log and allow request through so app loads
    console.error("[proxy] Clerk error:", err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
});

export default function middleware(req: Request) {
  const fapiResponse = clerkFapiProxy(req);
  if (fapiResponse) return fapiResponse;
  return clerkHandler(req);
}

export const config = {
  matcher: [
    // Clerk Frontend API proxy (must run before Clerk middleware)
    '/(__clerk)(.*)',
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
