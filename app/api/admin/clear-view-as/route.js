import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";

const VIEW_AS_COOKIE = "admin_view_as";
const VIEW_AS_COMPANY_ID_COOKIE = "admin_view_company_id";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 0,
};

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEW_AS_COOKIE, "", cookieOpts);
  res.cookies.set(VIEW_AS_COMPANY_ID_COOKIE, "", cookieOpts);
  return res;
}
