import { NextResponse } from "next/server";
import crypto from "crypto";
import { setAdminSessionCookie } from "../../../../lib/adminAuth";

function constantTimeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = body.username ?? "";
    const password = body.password ?? "";

    const expectedUser = process.env.ADMIN_USERNAME ?? "";
    const expectedPass = process.env.ADMIN_PASSWORD ?? "";

    if (!expectedUser || !expectedPass) {
      return NextResponse.json(
        { error: "Admin login not configured" },
        { status: 503 }
      );
    }

    if (!constantTimeCompare(String(username), expectedUser) || !constantTimeCompare(String(password), expectedPass)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    setAdminSessionCookie(response);
    return response;
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
