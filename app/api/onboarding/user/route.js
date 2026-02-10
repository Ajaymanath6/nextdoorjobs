import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password if provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Prepare update data
      const updateData = {};
      if (name !== user.name) {
        updateData.name = name;
      }
      if (phone !== user.phone) {
        updateData.phone = phone || null;
      }
      if (clerkId !== undefined && clerkId !== user.clerkId) {
        updateData.clerkId = clerkId || null;
      }
      if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
        updateData.avatarUrl = avatarUrl || null;
      }
      // Update password if provided
      if (password) {
        const saltRounds = 10;
        updateData.passwordHash = await bcrypt.hash(password, saltRounds);
      }

      // Update user if there are changes
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { email },
          data: updateData,
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        message: "User retrieved successfully",
      });
    }

    // Create new user
    const userData = {
      email,
      name,
      phone: phone || null,
      clerkId: clerkId && String(clerkId).trim() ? String(clerkId).trim() : null,
      avatarUrl: avatarUrl && String(avatarUrl).trim() ? String(avatarUrl).trim() : null,
    };

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      userData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    user = await prisma.user.create({
      data: userData,
    });

    if (password) {
      try {
        const sessionToken = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const cookieStore = await cookies();
        cookieStore.set("session_token", sessionToken, {
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
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

    const email = emailParam.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Optionally update Clerk linkage when found by email (best-effort; do not 500 if update fails)
    const clerkIdStr = clerkId != null && String(clerkId).trim() ? String(clerkId).trim() : null;
    const avatarUrlStr = avatarUrl != null && String(avatarUrl).trim() ? String(avatarUrl).trim() : null;
    if (clerkIdStr || avatarUrlStr) {
      try {
        const updateData = {};
        if (clerkIdStr) updateData.clerkId = clerkIdStr;
        if (avatarUrlStr) updateData.avatarUrl = avatarUrlStr;
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { email },
            data: updateData,
          });
        }
      } catch (updateErr) {
        console.error("Error updating Clerk linkage in user GET:", updateErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
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
