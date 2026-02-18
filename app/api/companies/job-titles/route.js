import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * POST /api/companies/job-titles
 * Fetch job titles for multiple companies
 */
export async function POST(request) {
  try {
    const { companyIds } = await request.json();
    
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json(
        { error: "companyIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch active job titles for these companies
    const jobs = await prisma.jobPosition.findMany({
      where: {
        companyId: { in: companyIds },
        isActive: true,
      },
      select: {
        title: true,
        companyId: true,
      },
      distinct: ['title'],
      take: 10, // Limit to 10 unique job titles
    });

    // Group by unique titles
    const titles = [...new Set(jobs.map(job => job.title))];

    return NextResponse.json({
      success: true,
      titles,
      count: titles.length,
    });
  } catch (error) {
    console.error("Error fetching job titles:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job titles",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
