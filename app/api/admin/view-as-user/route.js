import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";

const VIEW_AS_COOKIE = "admin_view_as";
const VIEW_AS_COMPANY_ID_COOKIE = "admin_view_company_id";

async function getAdminOwnerUserId() {
  const idFromEnv = process.env.ADMIN_OWNER_USER_ID;
  if (idFromEnv) {
    const id = parseInt(String(idFromEnv).trim(), 10);
    if (!Number.isNaN(id) && id > 0) return id;
  }
  const email = process.env.ADMIN_OWNER_EMAIL;
  if (email && String(email).trim()) {
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true },
    });
    if (user) return user.id;
  }
  return null;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const cookieStore = await cookies();
  const viewAs = cookieStore.get(VIEW_AS_COOKIE)?.value;
  const companyIdRaw = cookieStore.get(VIEW_AS_COMPANY_ID_COOKIE)?.value;
  const companyId = companyIdRaw ? parseInt(companyIdRaw, 10) : null;

  if (viewAs !== "individual" && viewAs !== "company") {
    return NextResponse.json({ error: "No view-as role set" }, { status: 400 });
  }

  const userId = await getAdminOwnerUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Admin owner not configured" },
      { status: 503 }
    );
  }

  const accountType = viewAs === "company" ? "Company" : "Individual";
  const user = {
    id: userId,
    accountType,
    email: null,
    name: "Admin (view as)",
  };
  if (viewAs === "company" && !Number.isNaN(companyId) && companyId > 0) {
    user.companyId = companyId;
  }

  return NextResponse.json({ success: true, user });
}
