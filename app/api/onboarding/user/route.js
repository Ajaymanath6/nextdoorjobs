import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * POST /api/onboarding/user
 * Create or retrieve a user by email
 * Body: { email: string, name: string, phone?: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, phone } = body;

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

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update user if name or phone changed
      if (name !== user.name || phone !== user.phone) {
        user = await prisma.user.update({
          where: { email },
          data: {
            name,
            phone: phone || null,
          },
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
    user = await prisma.user.create({
      data: {
        email,
        name,
        phone: phone || null,
      },
    });

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
 * GET /api/onboarding/user?email=...
 * Retrieve user by email
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
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
