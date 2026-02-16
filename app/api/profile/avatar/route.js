import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/getCurrentUser";
import { userService } from "../../../../lib/services/user.service";
import { AVATAR_IDS, getAvatarUrlById } from "../../../../lib/avatars";

/**
 * POST /api/profile/avatar
 * Set current user's avatar by id.
 * Body: { avatarId: string }
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const avatarId =
      typeof body.avatarId === "string" ? body.avatarId.trim() : null;

    if (!avatarId || !AVATAR_IDS.includes(avatarId)) {
      return NextResponse.json(
        { error: "Invalid or missing avatarId" },
        { status: 400 }
      );
    }

    const avatarUrl = getAvatarUrlById(avatarId);

    await userService.updateAvatar(user.id, avatarId, avatarUrl);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error in profile avatar POST:", error);
    const message = error?.message || "";
    const hint =
      message.includes("avatar_id") || message.includes("Unknown arg")
        ? " Run: npx prisma db push"
        : "";
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? `${error.message}${hint}`
            : undefined,
      },
      { status: 500 }
    );
  }
}
