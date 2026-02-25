import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SEC = 24 * 60 * 60; // 24 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 16 characters");
  }
  return secret;
}

/**
 * Create a signed payload: timestamp.hexSignature
 */
function signPayload(timestamp) {
  const secret = getSecret();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(timestamp));
  const signature = hmac.digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Verify signed payload and optional expiry (24h).
 * Returns { ok: true } if valid, null otherwise.
 */
function verifyPayload(value) {
  if (!value || typeof value !== "string") return null;
  const secret = getSecret();
  const [timestampStr, signature] = value.split(".");
  if (!timestampStr || !signature) return null;
  const timestamp = parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp)) return null;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(timestamp));
  const expected = hmac.digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > MAX_AGE_SEC) return null;
  return { ok: true };
}

/**
 * Set the admin session cookie on the response.
 * @param {NextResponse} response - NextResponse to set cookie on
 * @returns {NextResponse} same response
 */
export function setAdminSessionCookie(response) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = signPayload(timestamp);
  response.cookies.set(COOKIE_NAME, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
  return response;
}

/**
 * Clear the admin session cookie on the response.
 * @param {NextResponse} response - NextResponse to clear cookie on
 * @returns {NextResponse} same response
 */
export function clearAdminSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

/**
 * Get and verify admin session from request cookies.
 * Returns { ok: true } if valid, null otherwise.
 */
export async function getAdminSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyPayload(cookie.value);
}
