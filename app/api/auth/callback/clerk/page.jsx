'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Page at /api/auth/callback/clerk — must match redirectUrl in EmailAuthForm.
 * When Google/Clerk redirects back here, this component processes the redirect,
 * establishes the Clerk session, then redirects to redirectUrlComplete (/onboarding).
 */
export default function ClerkCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
