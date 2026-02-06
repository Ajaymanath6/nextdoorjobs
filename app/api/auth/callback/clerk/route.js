import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/callback/clerk
 * Callback route for Clerk OAuth (Google SSO)
 * Syncs Clerk user with database
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Get user details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}` 
      : clerkUser.firstName || clerkUser.username || 'User';
    const avatarUrl = clerkUser.imageUrl;

    if (!email) {
      return NextResponse.redirect(new URL('/onboarding?error=no_email', request.url));
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Create new user in database
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          clerkId: userId,
          avatarUrl: avatarUrl || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
    } else {
      // Update existing user with Clerk ID if not set
      if (!user.clerkId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            clerkId: userId,
            avatarUrl: avatarUrl || user.avatarUrl,
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        });
      }
    }

    // Create session cookie for compatibility with existing auth system
    try {
      const sessionToken = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const cookieStore = await cookies();
      
      cookieStore.set("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    } catch (cookieError) {
      console.error("Error setting session cookie:", cookieError);
    }

    // Redirect to onboarding chat interface after sign-in (not main app)
    return NextResponse.redirect(new URL('/onboarding', request.url));
  } catch (error) {
    console.error("Error in Clerk callback:", error);
    return NextResponse.redirect(new URL('/onboarding?error=auth_failed', request.url));
  }
}
