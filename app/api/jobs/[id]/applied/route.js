import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";

/**
 * POST /api/jobs/[id]/applied
 * Mark a job as applied (user-confirmed). Idempotent upsert.
 */
export async function POST(_request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const jobId = parseInt(resolvedParams.id, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await prisma.jobPosition.findUnique({
      where: { id: jobId },
      select: { id: true, isActive: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const application = await prisma.jobApplication.upsert({
      where: {
        userId_jobPositionId: {
          userId: user.id,
          jobPositionId: jobId,
        },
      },
      create: {
        userId: user.id,
        jobPositionId: jobId,
      },
      update: {},
      select: {
        id: true,
        jobPositionId: true,
        appliedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error marking job applied:", error);
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
