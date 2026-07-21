import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/getCurrentUser";

/**
 * GET /api/job-saves
 * List jobs the current user has saved.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saves = await prisma.jobSave.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: "desc" },
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

    const jobs = saves
      .filter((s) => s.jobPosition)
      .map((s) => {
        const job = s.jobPosition;
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
          savedAt: s.savedAt,
          hasSaved: true,
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
    console.error("Error listing job saves:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load saved jobs",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-saves
 * Body: { jobId: number }
 * Save a job. Idempotent upsert.
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

    const existing = await prisma.jobSave.findUnique({
      where: {
        userId_jobPositionId: {
          userId: user.id,
          jobPositionId: jobId,
        },
      },
      select: { id: true, jobPositionId: true, savedAt: true },
    });

    const save =
      existing ||
      (await prisma.jobSave.create({
        data: {
          userId: user.id,
          jobPositionId: jobId,
        },
        select: {
          id: true,
          jobPositionId: true,
          savedAt: true,
        },
      }));

    return NextResponse.json({
      success: true,
      save,
    });
  } catch (error) {
    console.error("Error saving job:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ success: true, save: null });
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save job",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/job-saves
 * Body: { jobId: number }
 * Unsave a job.
 */
export async function DELETE(request) {
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

    await prisma.jobSave.deleteMany({
      where: {
        userId: user.id,
        jobPositionId: jobId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsaving job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to unsave job",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
