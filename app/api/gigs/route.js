import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/getCurrentUser";
import { prisma } from "../../../lib/prisma";

/**
 * POST /api/gigs
 * Create a gig for the current user (Individual). Auth via getCurrentUser.
 * Body: title, description?, serviceType, state, district, pincode?, locality?, latitude?, longitude?
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }
    if (!serviceType || typeof serviceType !== "string" || !serviceType.trim()) {
      return NextResponse.json(
        { success: false, error: "Service type is required" },
        { status: 400 }
      );
    }
    if (!state || typeof state !== "string" || !state.trim()) {
      return NextResponse.json(
        { success: false, error: "State is required" },
        { status: 400 }
      );
    }
    if (!district || typeof district !== "string" || !district.trim()) {
      return NextResponse.json(
        { success: false, error: "District is required" },
        { status: 400 }
      );
    }

    const gig = await prisma.gig.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description != null && String(description).trim() !== "" ? String(description).trim() : null,
        serviceType: serviceType.trim(),
        expectedSalary: expectedSalary != null && String(expectedSalary).trim() !== "" ? String(expectedSalary).trim() : null,
        experienceWithGig: experienceWithGig != null && String(experienceWithGig).trim() !== "" ? String(experienceWithGig).trim() : null,
        customersTillDate: (() => {
        if (typeof customersTillDate === "number" && Number.isInteger(customersTillDate) && customersTillDate >= 0) return customersTillDate;
        if (typeof customersTillDate === "string" && /^\d+$/.test(customersTillDate.trim())) return parseInt(customersTillDate.trim(), 10);
        return null;
      })(),
        state: state.trim(),
        district: district.trim(),
        pincode: pincode != null && String(pincode).trim() !== "" ? String(pincode).trim() : null,
        locality: locality != null && String(locality).trim() !== "" ? String(locality).trim() : null,
        latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null,
        longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarId: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, gig });
  } catch (err) {
    console.error("POST /api/gigs error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create gig" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gigs
 * List gigs with optional location filter: state, district, pincode.
 * Returns gigs with user (avatarId, avatarUrl, name) for map markers.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");

    if (mine === "1") {
      const user = await getCurrentUser();
      if (!user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      const gigs = await prisma.gig.findMany({
        where: { userId: user.id },
        include: {
          user: {
            select: { id: true, name: true, avatarId: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, gigs });
    }

    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const pincode = searchParams.get("pincode");

    const where = {};
    if (state && state.trim()) where.state = { equals: state.trim(), mode: "insensitive" };
    if (district && district.trim()) where.district = { equals: district.trim(), mode: "insensitive" };
    if (pincode && pincode.trim()) where.pincode = pincode.trim();

    const gigs = await prisma.gig.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        user: {
          select: { id: true, name: true, avatarId: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, gigs });
  } catch (err) {
    console.error("GET /api/gigs error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to list gigs" },
      { status: 500 }
    );
  }
}
