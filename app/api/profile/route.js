import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/getCurrentUser";
import { prisma } from "../../../lib/prisma";

const NAME_MAX_LENGTH = 255;

/**
 * PATCH /api/profile
 * Update current user profile (e.g. display name).
 * Body: { name?: string }
 */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name: rawName } = body;

    if (rawName === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const name =
      typeof rawName === "string"
        ? rawName.trim().slice(0, NAME_MAX_LENGTH)
        : "";

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: name || user.name },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Error in profile PATCH:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
