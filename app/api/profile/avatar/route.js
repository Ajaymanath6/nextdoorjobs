import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/getCurrentUser";
import { userService } from "../../../../lib/services/user.service";
import { AVATAR_IDS, getAvatarUrlById } from "../../../../lib/avatars";

/**
 * POST /api/profile/avatar
 * Set current user's avatar by id or custom URL.
 * Body: { avatarId: string } OR { avatarUrl: string }
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
    const avatarUrl =
      typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : null;

    // Handle custom avatarUrl (from device upload)
    if (avatarUrl) {
      // Validate URL format
      if (!avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
        return NextResponse.json(
          { error: "Invalid avatarUrl format. Must be a valid HTTP/HTTPS URL." },
          { status: 400 }
        );
      }

      // Update with custom URL (set avatarId to null)
      await userService.updateAvatar(user.id, null, avatarUrl);
      return new Response(null, { status: 200 });
    }

    // Handle predefined avatarId (existing flow)
    if (!avatarId || !AVATAR_IDS.includes(avatarId)) {
      return NextResponse.json(
        { error: "Invalid or missing avatarId. Provide either avatarId or avatarUrl." },
        { status: 400 }
      );
    }

    const predefinedAvatarUrl = getAvatarUrlById(avatarId);
    await userService.updateAvatar(user.id, avatarId, predefinedAvatarUrl);

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
