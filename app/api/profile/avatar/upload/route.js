import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";
import { imgbbService } from "../../../../../lib/services/imgbb.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/profile/avatar/upload
 * Upload image from device to imgbb and return URL.
 * Body: multipart/form-data with 'image' field
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    // Upload to imgbb
    const result = await imgbbService.uploadImage(file, {
      name: file.name || `avatar_${user.id}`,
    });

    if (result.success && result.url) {
      return NextResponse.json({
        success: true,
        url: result.url,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to upload image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in avatar upload POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
