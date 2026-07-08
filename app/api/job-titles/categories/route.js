import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/job-titles/categories
 * Distinct industry categories from job_titles table.
 */
export async function GET() {
  try {
    const rows = await prisma.jobTitle.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    const categories = rows.map((r) => r.category).filter(Boolean);
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("GET /api/job-titles/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
