import { NextResponse } from "next/server";
import { JOB_CATEGORIES } from "../../../../lib/constants/jobCategories";
import { jobService } from "../../../../lib/services/job.service";

/**
 * POST /api/onboarding/job-position
 * Create a new job position
 * Body: {
 *   title: string
 *   category: string (JobCategory enum)
 *   yearsRequired: number
 *   salaryMin: number (optional)
 *   salaryMax: number (optional)
 *   jobDescription: string
 *   companyId: number
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      category,
      yearsRequired,
      salaryMin,
      salaryMax,
      jobDescription,
      companyId,
    } = body;

    // Validate category
    const validCategories = JOB_CATEGORIES.map((cat) => cat.value);
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Use JobService to create job position
    try {
      const jobPosition = await jobService.createJobPosition({
        title,
        category,
        yearsRequired,
        salaryMin,
        salaryMax,
        jobDescription,
        companyId,
      });

      return NextResponse.json({
        success: true,
        jobPosition: {
          id: jobPosition.id,
          title: jobPosition.title,
          category: jobPosition.category,
          yearsRequired: jobPosition.yearsRequired,
          salaryMin: jobPosition.salaryMin,
          salaryMax: jobPosition.salaryMax,
          jobDescription: jobPosition.jobDescription,
          companyId: jobPosition.companyId,
          isActive: jobPosition.isActive,
        },
        message: "Job position created successfully",
      });
    } catch (serviceError) {
      // Service errors are validation errors (400)
      return NextResponse.json(
        { error: serviceError.message },
        { status: serviceError.message.includes('not found') ? 404 : 400 }
      );
    }
  } catch (error) {
    console.error("Error in job position API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
