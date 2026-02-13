import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/pincodes/by-pincode?pincode=673001
 * Returns { pincode: { pincode, localityName, district, state, latitude, longitude } } or { pincode: null }.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode");

  if (!pincode?.trim()) {
    return NextResponse.json({ pincode: null });
  }

  try {
    const row = await prisma.pincode.findFirst({
      where: { pincode: pincode.trim() },
      select: {
        pincode: true,
        localityName: true,
        district: true,
        state: true,
        latitude: true,
        longitude: true,
      },
    });
    const result = row
      ? {
          pincode: row.pincode,
          localityName: row.localityName,
          district: row.district,
          state: row.state,
          latitude: row.latitude,
          longitude: row.longitude,
        }
      : null;
    return NextResponse.json({ pincode: result });
  } catch (error) {
    console.error("Pincode by-pincode error:", error?.message);
    return NextResponse.json({ pincode: null });
  }
}
