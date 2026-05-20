import { ClerkCallbackClient } from './ClerkCallbackClient';
import { isClerkConfigured } from '../../../../../lib/clerkConfig';

/**
 * OAuth redirect target for Clerk (see EmailAuthForm redirectUrl).
 * Only mounts Clerk client components when both keys are valid (matches app/layout.js).
 */
export default function ClerkCallbackPage() {
  if (!isClerkConfigured()) {
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
