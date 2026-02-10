import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/pincodes/by-district?district=Thrissur&state=Kerala
 * Returns { pincodes: string[] } with at most 4 unique pincodes for the given district and state.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const state = searchParams.get("state");

  if (!district?.trim() || !state?.trim()) {
    return NextResponse.json({ pincodes: [] });
  }

  try {
    const rows = await prisma.pincode.findMany({
      where: {
        district: { equals: district.trim(), mode: "insensitive" },
        state: { equals: state.trim(), mode: "insensitive" },
      },
      distinct: ["pincode"],
      select: { pincode: true },
      take: 4,
      orderBy: { pincode: "asc" },
    });

    const pincodes = rows.map((r) => r.pincode);
    return NextResponse.json({ pincodes });
  } catch (error) {
    console.error("Pincodes by-district error:", error?.message);
    return NextResponse.json({ pincodes: [] });
  }
}
