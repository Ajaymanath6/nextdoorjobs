import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

/**
 * GET /api/jobs/applied
 * List jobs the current user has marked as applied.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { appliedAt: "desc" },
      take: 200,
      include: {
        jobPosition: {
          select: {
            id: true,
            title: true,
            category: true,
            yearsRequired: true,
            salaryMin: true,
            salaryMax: true,
            jobDescription: true,
            remoteType: true,
            employmentType: true,
            applicationUrl: true,
            createdAt: true,
            updatedAt: true,
            company: {
              select: {
                id: true,
                name: true,
                logoPath: true,
                latitude: true,
                longitude: true,
                state: true,
                district: true,
              },
            },
          },
        },
      },
    });

    const jobs = applications
      .filter((a) => a.jobPosition)
      .map((a) => {
        const job = a.jobPosition;
        const company = job.company;
        const lat =
          company?.latitude != null ? parseFloat(company.latitude) : null;
        const lon =
          company?.longitude != null ? parseFloat(company.longitude) : null;
        return {
          id: job.id,
          title: job.title,
          category: job.category,
          yearsRequired: job.yearsRequired,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          jobDescription: job.jobDescription,
          remoteType: job.remoteType,
          employmentType: job.employmentType,
          applicationUrl: job.applicationUrl,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          appliedAt: a.appliedAt,
          hasApplied: true,
          company: company
            ? {
                id: company.id,
                name: company.name,
                logoPath: company.logoPath,
                logoUrl: company.logoPath,
                lat,
                lon,
                latitude: lat,
                longitude: lon,
                state: company.state,
                district: company.district,
              }
            : null,
        };
      });

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error("Error listing applied jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load applied jobs",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
