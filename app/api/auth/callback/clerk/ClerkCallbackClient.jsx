'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export function ClerkCallbackClient() {
  return <AuthenticateWithRedirectCallback />;
}
