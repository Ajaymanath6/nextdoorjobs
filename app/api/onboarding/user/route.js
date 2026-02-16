import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { onboardingService } from "../../../../lib/services/onboarding.service";

/**
 * POST /api/onboarding/user
 * Create or retrieve a user by email
 * Body: { email: string, name: string, password?: string, phone?: string, clerkId?: string, avatarUrl?: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, password, phone, clerkId, avatarUrl } = body;

    // Validation
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Use OnboardingService to create or update user
    const result = await onboardingService.createOrUpdateUser({
      email,
      name,
      password,
      phone,
      clerkId,
      avatarUrl,
    });

    // Set session cookie if session token was created
    if (result.sessionToken) {
      try {
        const cookieStore = await cookies();
        cookieStore.set("session_token", result.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      } catch (cookieError) {
        console.error("Error setting session cookie:", cookieError);
      }
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: result.isNew ? "User created successfully" : "User retrieved successfully",
    });
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: error.message.includes('Invalid') || error.message.includes('required') ? 400 : 500 }
    );
  }
}

/**
 * GET /api/onboarding/user?email=...&clerkId=...&avatarUrl=...
 * Retrieve user by email. Optionally pass clerkId and avatarUrl to link Clerk and update profile.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");
    const clerkId = searchParams.get("clerkId");
    const avatarUrl = searchParams.get("avatarUrl");

    if (!emailParam || typeof emailParam !== "string") {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Use OnboardingService to get user
    const user = await onboardingService.getUserByEmail(emailParam, {
      clerkId,
      avatarUrl,
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
    console.error("Error in user GET API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
