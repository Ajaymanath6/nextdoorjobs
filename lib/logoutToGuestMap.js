"use client";

/**
 * Clear app + Clerk session and always hard-navigate to the guest
 * onboarding map at /onboarding (never leave stale chat UI).
 * @param {((opts?: { redirectUrl?: string }) => Promise<void>) | null | undefined} signOutFn
 */
export async function logoutToGuestMap(signOutFn) {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch (_) {
    /* ignore */
  }

  try {
    if (typeof signOutFn === "function") {
      await signOutFn();
    }
  } catch (_) {
    /* ignore */
  }

  if (typeof window !== "undefined") {
    window.location.replace("/onboarding");
  }
}
