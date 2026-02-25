import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { companyService } from "../../../../lib/services/company.service";

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
  const userId = await getAdminOwnerUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL and run seed." },
      { status: 503 }
    );
  }
  try {
    const companies = await companyService.getCompaniesByUser(userId);
    return NextResponse.json({ success: true, companies });
  } catch (e) {
    console.error("Admin GET companies error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = await getAdminOwnerUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL and run seed." },
      { status: 503 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      description,
      websiteUrl,
      fundingSeries,
      latitude,
      longitude,
      state,
      district,
      pincode,
    } = body;

    if (!name || !state || !district) {
      return NextResponse.json(
        { error: "Name, state, and district are required" },
        { status: 400 }
      );
    }

    const company = await companyService.createCompany(userId, {
      name: String(name).trim(),
      description: description != null ? String(description).trim() : null,
      logoPath: null,
      websiteUrl: websiteUrl != null ? String(websiteUrl).trim() : null,
      fundingSeries: fundingSeries || null,
      latitude: latitude != null ? parseFloat(latitude) : null,
      longitude: longitude != null ? parseFloat(longitude) : null,
      state: String(state).trim(),
      district: String(district).trim(),
      pincode: pincode != null ? String(pincode).trim() : null,
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        description: company.description,
        state: company.state,
        district: company.district,
      },
    });
  } catch (e) {
    console.error("Admin POST company error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.message && e.message.includes("required") ? 400 : 500 }
    );
  }
}
