import { NextResponse } from "next/server";
import { jobService } from "../../../lib/services/job.service";

/**
 * GET /api/job-titles
 * Get all job titles with optional search query
 * Query params: ?q=search_term
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category")?.trim() || null;

    let jobTitles = await jobService.getAllJobTitles(query);

    if (category) {
      const catLower = category.toLowerCase();
      jobTitles = jobTitles.filter(
        (j) => j.category && j.category.toLowerCase() === catLower
      );
    }

    return NextResponse.json(jobTitles);
  } catch (error) {
    console.error("❌ Error fetching job titles:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
