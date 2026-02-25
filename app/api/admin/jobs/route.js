import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { jobService } from "../../../../lib/services/job.service";

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

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = await getAdminOwnerUserId();
  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Admin owner not configured. Set ADMIN_OWNER_USER_ID or ADMIN_OWNER_EMAIL and run seed.",
      },
      { status: 503 }
    );
  }

  try {
    const companies = await prisma.company.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const companyIds = companies.map((c) => c.id);
    if (companyIds.length === 0) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const jobs = await prisma.jobPosition.findMany({
      where: {
        companyId: { in: companyIds },
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        jobDescription: true,
        yearsRequired: true,
        salaryMin: true,
        salaryMax: true,
        remoteType: true,
        seniorityLevel: true,
        isActive: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            latitude: true,
            longitude: true,
            logoPath: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const formatted = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      jobDescription: job.jobDescription,
      yearsRequired: job.yearsRequired,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      remoteType: job.remoteType,
      seniorityLevel: job.seniorityLevel,
      isActive: job.isActive,
      createdAt: job.createdAt,
      companyName: job.company?.name ?? undefined,
      company: job.company
        ? {
            id: job.company.id,
            name: job.company.name,
            websiteUrl: job.company.websiteUrl ?? undefined,
            latitude: job.company.latitude ?? undefined,
            longitude: job.company.longitude ?? undefined,
            logoPath: job.company.logoPath ?? undefined,
          }
        : undefined,
    }));

    return NextResponse.json({ success: true, jobs: formatted });
  } catch (e) {
    console.error("Admin GET jobs error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      category,
      yearsRequired,
      salaryMin,
      salaryMax,
      jobDescription,
      remoteType,
      assistRelocation,
      seniorityLevel,
      teamSize,
      perks,
      holidays,
      companyId,
    } = body;

    if (!title || !category || !jobDescription || companyId == null) {
      return NextResponse.json(
        {
          error:
            "Title, category, jobDescription, and companyId are required",
        },
        { status: 400 }
      );
    }

    const jobPosition = await jobService.createJobPosition({
      title: String(title).trim(),
      category,
      yearsRequired: yearsRequired != null ? parseFloat(yearsRequired) : 0,
      salaryMin: salaryMin != null ? parseInt(salaryMin, 10) : null,
      salaryMax: salaryMax != null ? parseInt(salaryMax, 10) : null,
      jobDescription: String(jobDescription).trim(),
      remoteType: remoteType || null,
      assistRelocation:
        assistRelocation != null ? Boolean(assistRelocation) : false,
      seniorityLevel: seniorityLevel || null,
      teamSize: teamSize || null,
      perks: Array.isArray(perks) ? perks : [],
      holidays: holidays || null,
      companyId: parseInt(companyId, 10),
    });

    return NextResponse.json({
      success: true,
      jobPosition: {
        id: jobPosition.id,
        title: jobPosition.title,
        companyId: jobPosition.companyId,
      },
    });
  } catch (e) {
    console.error("Admin POST job error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      {
        status:
          e.message &&
          (e.message.includes("required") || e.message.includes("not found"))
            ? 400
            : 500,
      }
    );
  }
}
