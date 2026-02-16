import { NextResponse } from "next/server";
import { locationService } from "../../../../lib/services/location.service";

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
    // Use LocationService with Redis caching (1 hour TTL)
    const result = await locationService.getPincodeInfo(pincode);
    
    return NextResponse.json({ pincode: result });
  } catch (error) {
    console.error("Pincode by-pincode error:", error?.message);
    return NextResponse.json({ pincode: null });
  }
}
