import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Resolves the current request to a DB User (Clerk or cookie-based session).
 * Returns { id, email, name, phone } or null if not authenticated.
 */
export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (clerkUserId) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: { id: true, email: true, name: true, phone: true },
        });
        return user;
      }
    }
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");
  if (!sessionToken) return null;

  const userIdFromCookie = parseInt(sessionToken.value.split("-")[0], 10);
  if (Number.isNaN(userIdFromCookie)) return null;

  const user = await prisma.user.findUnique({
    where: { id: userIdFromCookie },
    select: { id: true, email: true, name: true, phone: true },
  });
  return user;
}
