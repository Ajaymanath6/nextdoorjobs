import { clerkMiddleware, createRouteMatcher, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from './lib/prisma';

/** Proxy Frontend API requests to Clerk so custom domain (clerk.mapmygig.com) is not required. */
function clerkFapiProxy(req: Request) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/__clerk')) return null;

  const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || '';
  const secretKey = process.env.CLERK_SECRET_KEY || '';
  if (!proxyUrl || !secretKey) return null;

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
      // Check if user has accountType set - if yes, allow map access; if no, redirect to who-are-you
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          if (email) {
            const emailNorm = email.toLowerCase().trim();
            const user = await prisma.user.findUnique({
              where: { email: emailNorm },
              select: { accountType: true },
            });
            // If accountType is set, allow access to map (/)
            if (user?.accountType) {
              return NextResponse.next();
            }
            // If user exists but accountType is null/empty, redirect to who-are-you
            if (user && (user.accountType === null || user.accountType === '')) {
              return NextResponse.redirect(new URL('/who-are-you', req.url));
            }
          }
        }
      } catch (err) {
        // If DB lookup fails, allow access to map (graceful degradation)
        // The client-side code will handle redirecting if needed
        console.error("[proxy] Error checking accountType:", err instanceof Error ? err.message : String(err));
        return NextResponse.next();
      }
      // If we can't determine accountType status, allow access (client will handle redirect if needed)
      return NextResponse.next();
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
