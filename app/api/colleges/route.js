import { NextResponse } from "next/server";
import { jobService } from "../../../lib/services/job.service";

/**
 * GET /api/colleges
 * Get all colleges with optional search query
 * Query params: ?q=search_term
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // Use JobService with Redis caching
    const colleges = await jobService.getAllColleges(query);

    return NextResponse.json(colleges);
  } catch (error) {
    console.error("❌ Error fetching colleges:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
