import { NextResponse } from "next/server";
import { authService } from "../../../../lib/services/auth.service";

/**
 * GET /api/auth/me
 * Get current authenticated user from session (supports both Clerk and cookie-based auth)
 */
export async function GET() {
  try {
    // Use AuthService to get current user
    const user = await authService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
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
