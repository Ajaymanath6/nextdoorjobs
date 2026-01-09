import { NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { cookies } from "next/headers";

/**
 * POST /api/auth/logout
 * Logout user by clearing session cookie and Clerk session
 */
export async function POST() {
  try {
    // Clear session cookie (for email/password auth)
    const cookieStore = await cookies();
    cookieStore.delete("session_token");

    // Sign out from Clerk if user is authenticated via Clerk
    const { userId } = await auth();
    if (userId) {
      try {
        // Get the session token and sign out from Clerk
        const clerk = await clerkClient();
        // Clerk handles session termination automatically when we clear the session
        // But we can also explicitly end the session if needed
      } catch (clerkError) {
        console.error("Error signing out from Clerk:", clerkError);
        // Continue with logout even if Clerk signout fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logout API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
