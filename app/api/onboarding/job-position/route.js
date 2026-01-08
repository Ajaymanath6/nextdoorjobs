import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { JOB_CATEGORIES } from "../../../../lib/constants/jobCategories";

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

    // Validation
    if (!title || !category || !jobDescription || !companyId) {
      return NextResponse.json(
        { error: "Title, category, jobDescription, and companyId are required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = JOB_CATEGORIES.map((cat) => cat.value);
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate yearsRequired
    const years = yearsRequired !== undefined ? parseFloat(yearsRequired) : 0;
    if (isNaN(years) || years < 0) {
      return NextResponse.json(
        { error: "yearsRequired must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate salary range
    const minSalary = salaryMin !== undefined && salaryMin !== null ? parseInt(salaryMin) : null;
    const maxSalary = salaryMax !== undefined && salaryMax !== null ? parseInt(salaryMax) : null;

    if (minSalary !== null && (isNaN(minSalary) || minSalary < 0)) {
      return NextResponse.json(
        { error: "salaryMin must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (maxSalary !== null && (isNaN(maxSalary) || maxSalary < 0)) {
      return NextResponse.json(
        { error: "salaryMax must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (
      minSalary !== null &&
      maxSalary !== null &&
      minSalary > maxSalary
    ) {
      return NextResponse.json(
        { error: "salaryMin cannot be greater than salaryMax" },
        { status: 400 }
      );
    }

    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Create job position
    const jobPosition = await prisma.jobPosition.create({
      data: {
        title: title.toString(),
        category,
        yearsRequired: years,
        salaryMin: minSalary,
        salaryMax: maxSalary,
        jobDescription: jobDescription.toString(),
        companyId: parseInt(companyId),
        isActive: true,
      },
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
