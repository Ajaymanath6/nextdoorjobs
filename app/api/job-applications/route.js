import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/getCurrentUser";

/**
 * GET /api/job-applications
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
    console.error("Error listing job applications:", error);
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

/**
 * POST /api/job-applications
 * Body: { jobId: number }
 * Mark a job as applied (user-confirmed). Idempotent upsert.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const jobId = parseInt(body?.jobId ?? body?.jobPositionId, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await prisma.jobPosition.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const existing = await prisma.jobApplication.findUnique({
      where: {
        userId_jobPositionId: {
          userId: user.id,
          jobPositionId: jobId,
        },
      },
      select: { id: true, jobPositionId: true, appliedAt: true },
    });

    const application =
      existing ||
      (await prisma.jobApplication.create({
        data: {
          userId: user.id,
          jobPositionId: jobId,
        },
        select: {
          id: true,
          jobPositionId: true,
          appliedAt: true,
        },
      }));

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error marking job applied:", error);
    // Unique race: treat as success
    if (error?.code === "P2002") {
      return NextResponse.json({ success: true, application: null });
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark job as applied",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
