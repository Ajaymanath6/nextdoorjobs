import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { gigService } from "../../../../lib/services/gig.service";

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

async function getOrCreateUserByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  if (!normalized) return null;
  let user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (user) return user.id;
  const name = normalized.split("@")[0] || "User";
  const newUser = await prisma.user.create({
    data: {
      email: normalized,
      name: name.slice(0, 255),
    },
    select: { id: true },
  });
  return newUser.id;
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const defaultUserId = await getAdminOwnerUserId();
  if (!defaultUserId) {
    return NextResponse.json(
      { error: "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL and run seed." },
      { status: 503 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      description,
      serviceType,
      expectedSalary,
      experienceWithGig,
      customersTillDate,
      state,
      district,
      pincode,
      locality,
      latitude,
      longitude,
      email: gigWorkerEmail,
    } = body;

    if (!title || !serviceType || !state || !district) {
      return NextResponse.json(
        { error: "Title, serviceType, state, and district are required" },
        { status: 400 }
      );
    }

    let userId = defaultUserId;
    if (gigWorkerEmail && String(gigWorkerEmail).trim()) {
      const resolvedId = await getOrCreateUserByEmail(gigWorkerEmail);
      if (resolvedId) userId = resolvedId;
    }

    const gigData = {
      title: String(title).trim(),
      description: description != null && String(description).trim() ? String(description).trim() : null,
      serviceType: String(serviceType).trim(),
      expectedSalary: expectedSalary != null && String(expectedSalary).trim() ? String(expectedSalary).trim() : null,
      experienceWithGig: experienceWithGig != null && String(experienceWithGig).trim() ? String(experienceWithGig).trim() : null,
      customersTillDate:
        typeof customersTillDate === "number" && Number.isInteger(customersTillDate) && customersTillDate >= 0
          ? customersTillDate
          : typeof customersTillDate === "string" && /^\d+$/.test(String(customersTillDate).trim())
            ? parseInt(String(customersTillDate).trim(), 10)
            : null,
      state: String(state).trim(),
      district: String(district).trim(),
      pincode: pincode != null ? String(pincode).trim() : null,
      locality: locality != null ? String(locality).trim() : null,
      latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null,
      longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null,
    };

    const gig = await gigService.createGig(userId, gigData);

    return NextResponse.json({
      success: true,
      gig: {
        id: gig.id,
        title: gig.title,
        state: gig.state,
        district: gig.district,
      },
    });
  } catch (e) {
    console.error("Admin POST gig error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
