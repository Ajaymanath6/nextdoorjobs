import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

/**
 * POST /api/auth/signin
 * Sign in or register user - if user exists, login; if not, create and login
 * Body: { email: string, password: string, name: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const nameTrimmed = name.trim();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (user) {
      // User exists - verify password and login
      if (!user.passwordHash) {
        // User exists but has no password - update with new password
        const passwordHash = await bcrypt.hash(password, 10);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, name: nameTrimmed },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        });
      } else {
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Invalid password" },
            { status: 401 }
          );
        }
        // Update name if different
        if (user.name !== nameTrimmed) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name: nameTrimmed },
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          });
        }
      }
    } else {
      // User doesn't exist - create new user
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: emailLower,
          name: nameTrimmed,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    }

    // Create session and log user in
    try {
      const sessionToken = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const cookieStore = await cookies();
      
      // Set cookie with session token (expires in 30 days)
      cookieStore.set("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    } catch (cookieError) {
      console.error("Error setting session cookie:", cookieError);
      // Continue even if cookie setting fails - user is still created/logged in
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Signed in successfully",
    });
  } catch (error) {
    console.error("Error in signin API:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
