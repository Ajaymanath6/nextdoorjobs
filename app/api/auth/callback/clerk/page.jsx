import { ClerkCallbackClient } from './ClerkCallbackClient';

/**
 * OAuth redirect target for Clerk (see EmailAuthForm redirectUrl).
 * Only mounts Clerk client components when both keys are set (matches app/layout.js).
 */
export default function ClerkCallbackPage() {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!publishable || !secret) {
    return (
      <div style={{ padding: '1.5rem', fontFamily: 'system-ui' }}>
        <p>Clerk OAuth callback is not configured.</p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Set both NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env.local.
        </p>
      </div>
    );
  }
  return <ClerkCallbackClient />;
}
