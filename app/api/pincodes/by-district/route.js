import { NextResponse } from "next/server";
import { locationService } from "../../../../lib/services/location.service";

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
    // Use LocationService with Redis caching (1 hour TTL)
    const pincodes = await locationService.getPincodesByDistrict(district, state, 4);
    
    return NextResponse.json({ pincodes });
  } catch (error) {
    console.error("Pincodes by-district error:", error?.message);
    return NextResponse.json({ pincodes: [] });
  }
}
