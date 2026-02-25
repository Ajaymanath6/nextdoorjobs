import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAdminSession } from "../../../../../lib/adminAuth";

async function getAdminOwnerUserId() {
  const idFromEnv = process.env.ADMIN_OWNER_USER_ID;
  if (idFromEnv) {
    const id = parseInt(String(idFromEnv).trim(), 10);
    if (!Number.isNaN(id) && id > 0) return id;
  }
  const email = process.env.ADMIN_OWNER_EMAIL;
  if (email && String(email).trim()) {
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true },
    });
    if (user) return user.id;
  }
  return null;
}

// Soft delete a job position owned by the admin's companies
export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminOwnerId = await getAdminOwnerUserId();
  if (!adminOwnerId) {
    return NextResponse.json(
      {
        error:
          "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL and run seed.",
      },
      { status: 503 }
    );
  }

  try {
    const resolvedParams = await params;
    const jobId = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await prisma.jobPosition.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.company.userId !== adminOwnerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.jobPosition.update({
      where: { id: jobId },
      data: {
        isActive: false,
        autoDeletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Admin DELETE job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete job",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Extend a job posting (e.g. bump expiry)
export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminOwnerId = await getAdminOwnerUserId();
  if (!adminOwnerId) {
    return NextResponse.json(
      {
        error:
          "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL and run seed.",
      },
      { status: 503 }
    );
  }

  try {
    const resolvedParams = await params;
    const jobId = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await prisma.jobPosition.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.company.userId !== adminOwnerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const newExpiresAt =
      job.expiresAt && job.expiresAt > now
        ? new Date(job.expiresAt.getTime() + 14 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const updated = await prisma.jobPosition.update({
      where: { id: jobId },
      data: {
        expiresAt: newExpiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      job: updated,
    });
  } catch (error) {
    console.error("Admin EXTEND job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extend job",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

