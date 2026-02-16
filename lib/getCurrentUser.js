import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function isTimeoutError(e) {
  return e?.code === "ETIMEDOUT" || (e?.message && String(e.message).includes("ETIMEDOUT"));
}

function isInvalidFindUniqueError(e) {
  const msg = e?.message && String(e.message);
  return msg && (msg.includes("Invalid") && msg.includes("findUnique"));
}

/**
 * Resolves the current request to a DB User (Clerk or cookie-based session).
 * Returns { id, email, name, phone } or null if not authenticated.
 * Retries DB lookups on ETIMEDOUT (e.g. cold serverless DB). Uses inline loops
 * so Prisma sees direct findUnique invocations (no callback wrapper).
 */
export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (clerkUserId) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      const emailNorm = typeof email === "string" ? email.toLowerCase().trim() : "";
      if (emailNorm) {
        let lastError;
        for (let i = 0; i < MAX_RETRIES; i++) {
          try {
            return await prisma.user.findUnique({
              where: { email: emailNorm },
              select: { id: true, email: true, name: true, phone: true },
            });
          } catch (e) {
            lastError = e;
            if (isInvalidFindUniqueError(e)) {
              if (process.env.NODE_ENV === "development") {
                console.warn("[getCurrentUser] Prisma findUnique invalid (dev). Clerk email may be missing.", e?.message);
                return null;
              }
            }
            if (!isTimeoutError(e) || i === MAX_RETRIES - 1) throw e;
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }
        }
        throw lastError;
      }
    }
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");
  if (!sessionToken) return null;

  const userIdFromCookie = parseInt(sessionToken.value.split("-")[0], 10);
  if (Number.isNaN(userIdFromCookie) || userIdFromCookie < 1) return null;

  let lastError;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await prisma.user.findUnique({
        where: { id: userIdFromCookie },
        select: { id: true, email: true, name: true, phone: true },
      });
    } catch (e) {
      lastError = e;
      if (isInvalidFindUniqueError(e)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[getCurrentUser] Prisma findUnique invalid (dev). Cookie user id may be invalid.", e?.message);
          return null;
        }
      }
      if (!isTimeoutError(e) || i === MAX_RETRIES - 1) throw e;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw lastError;
}
