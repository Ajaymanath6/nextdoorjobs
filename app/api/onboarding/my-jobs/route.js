import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

/**
 * GET /api/onboarding/my-jobs
 * Fetch all jobs for the current user's companies
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Company accounts can have jobs
    if (user.accountType !== "Company") {
      return NextResponse.json(
        { error: "Only Company accounts can view job postings" },
        { status: 400 }
      );
    }

    // Fetch all companies owned by this user
    const companies = await prisma.company.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    if (companies.length === 0) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const companyIds = companies.map((c) => c.id);

    // Fetch all active jobs for these companies
    const jobs = await prisma.jobPosition.findMany({
      where: {
        companyId: { in: companyIds },
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoPath: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
