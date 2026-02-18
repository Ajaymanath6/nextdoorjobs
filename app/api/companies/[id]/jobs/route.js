import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(request, { params }) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const jobs = await prisma.jobPosition.findMany({
      where: {
        companyId,
        isActive: true,
      },
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
