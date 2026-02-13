import { NextResponse } from "next/server";
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";

/**
 * GET /api/auth/me
 * Get current authenticated user from session (supports both Clerk and cookie-based auth)
 */
export async function GET() {
  try {
    // First, try to get user from Clerk
    const { userId } = await auth();
    
    if (userId) {
      // User authenticated via Clerk
      const clerkUser = await currentUser();
      
      if (clerkUser) {
        const email =
          clerkUser.primaryEmailAddress?.emailAddress ||
          clerkUser.emailAddresses?.[0]?.emailAddress;
        if (email) {
          const emailNorm = email.toLowerCase().trim();
          let user = await prisma.user.findUnique({
            where: { email: emailNorm },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              avatarUrl: true,
              avatarId: true,
              accountType: true,
              createdAt: true,
            },
          });

          if (!user) {
            const derivedName =
              clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                : (clerkUser.firstName || clerkUser.username || "").trim();
            const fallbackName = emailNorm.split("@")[0] || "User";
            const name =
              (derivedName && derivedName !== "User") ? derivedName : fallbackName;
            user = await prisma.user.create({
              data: {
                email: emailNorm,
                name,
                phone: null,
                clerkId: clerkUser.id,
                avatarUrl:
                  clerkUser.imageUrl && String(clerkUser.imageUrl).trim()
                    ? String(clerkUser.imageUrl).trim()
                    : null,
              },
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatarUrl: true,
                avatarId: true,
                accountType: true,
                createdAt: true,
              },
            });
          }

          return NextResponse.json({
            success: true,
            user,
          });
        }
      }
    }

    // Fallback to cookie-based session (for email/password auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Extract user ID from session token (format: userId-timestamp-random)
    const userIdFromCookie = parseInt(sessionToken.value.split("-")[0]);

    if (isNaN(userIdFromCookie)) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userIdFromCookie },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        avatarId: true,
        accountType: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in me API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
