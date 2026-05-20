/**
 * Shared Clerk env checks — avoids middleware/ClerkProvider init with invalid or stale keys.
 */

function isValidPublishableKey(key) {
  if (!key?.trim()) return false;
  try {
    if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return false;
    const parts = key.split("_");
    if (parts.length !== 3 || !parts[2]) return false;
    const decoded = Buffer.from(parts[2], "base64").toString("utf8");
    return decoded.endsWith("$") && decoded.slice(0, -1).includes(".");
  } catch {
    return false;
  }
}

function isValidSecretKey(key) {
  if (!key?.trim()) return false;
  return /^sk_(test|live)_[a-zA-Z0-9]+$/.test(key.trim());
}

/** True when both Clerk keys are present and pass format validation. */
export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  return isValidPublishableKey(publishableKey) && isValidSecretKey(secretKey);
}

export function getClerkPublishableKey() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  return isValidPublishableKey(key) ? key : null;
}

/** Proxy URL only when explicitly configured (avoid invalid key + auto-proxy combos). */
export function getClerkProxyUrl() {
  return process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() || "";
}
