import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

const DESCRIPTION_MAX_LENGTH = 80;

/**
 * GET /api/onboarding/my-jobs
 * Returns the current user's job postings (latest first).
 * Each item: id, title, jobDescription (truncated), companyName, createdAt.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const companies = await prisma.company.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const companyIds = companies.map((c) => c.id);

    if (companyIds.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
      });
    }

    const positions = await prisma.jobPosition.findMany({
      where: { companyId: { in: companyIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        jobDescription: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    });

    const jobs = positions.map((p) => {
      const desc = p.jobDescription || "";
      const truncated =
        desc.length > DESCRIPTION_MAX_LENGTH
          ? desc.slice(0, DESCRIPTION_MAX_LENGTH).trim() + "…"
          : desc;
      return {
        id: p.id,
        title: p.title,
        jobDescription: truncated,
        companyName: p.company.name,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error in my-jobs API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
