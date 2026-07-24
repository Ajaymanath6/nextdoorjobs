import { NextResponse } from "next/server";
import { activeJobWhere } from "../../../../../lib/jobExpiry";
import { prisma } from "../../../../../lib/prisma";
import { remoteTypePrismaOr } from "../../../../../lib/jobMapFilters";

export async function GET(request, { params }) {
  try {
    // In Next.js 15+, params is a promise and needs to be awaited
    const resolvedParams = await params;
    const companyId = parseInt(resolvedParams.id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conditions = [
      { companyId },
      { ...activeJobWhere() },
    ];

    const remoteOr = remoteTypePrismaOr(searchParams.get("remoteType")?.trim());
    if (remoteOr) {
      conditions.push(remoteOr);
    }

    const employmentType = searchParams.get("employmentType")?.trim();
    if (employmentType) {
      conditions.push({ employmentType });
    }

    const title = searchParams.get("title")?.trim();
    if (title) {
      conditions.push({
        title: { contains: title, mode: "insensitive" },
      });
    }

    const category = searchParams.get("category")?.trim();
    if (category && !title) {
      conditions.push({
        OR: [
          { category: { equals: category, mode: "insensitive" } },
          { title: { contains: category, mode: "insensitive" } },
        ],
      });
    }

    const jobs = await prisma.jobPosition.findMany({
      where: { AND: conditions },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        category: true,
        yearsRequired: true,
        salaryMin: true,
        salaryMax: true,
        jobDescription: true,
        remoteType: true,
        assistRelocation: true,
        seniorityLevel: true,
        teamSize: true,
        perks: true,
        holidays: true,
        applicationUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching company jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
