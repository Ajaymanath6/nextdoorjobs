import { NextResponse } from "next/server";
import { locationService } from "../../../lib/services/location.service";

/**
 * GET /api/localities
 * Get all localities with Redis caching via LocationService
 */
export async function GET() {
  try {
    // Use service layer with Redis caching (1 hour TTL)
    const localities = await locationService.getAllLocalities("Kerala");

    return NextResponse.json(localities);
  } catch (error) {
    console.error("❌ Error fetching localities:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch localities",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
