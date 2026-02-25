import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";

const VIEW_AS_COOKIE = "admin_view_as";
const VIEW_AS_COMPANY_ID_COOKIE = "admin_view_company_id";
const MAX_AGE = 24 * 60 * 60; // 24h

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const role = body?.role === "company" ? "company" : "individual";
  const companyId = role === "company" && body?.companyId != null ? parseInt(String(body.companyId), 10) : null;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEW_AS_COOKIE, role, { ...cookieOpts, maxAge: MAX_AGE });
  if (role === "company" && !Number.isNaN(companyId) && companyId > 0) {
    res.cookies.set(VIEW_AS_COMPANY_ID_COOKIE, String(companyId), { ...cookieOpts, maxAge: MAX_AGE });
  } else {
    res.cookies.set(VIEW_AS_COMPANY_ID_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  }
  return res;
}
