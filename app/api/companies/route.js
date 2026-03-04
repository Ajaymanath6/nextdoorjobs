import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

/**
 * GET /api/companies
 * Fetch all companies with active jobs for map display.
 * Optional query: remoteType (e.g. Remote, Hybrid, Work from office) - filter companies that have at least one active job with that remoteType.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const remoteType = searchParams.get("remoteType")?.trim() || null;

    const jobPositionsCondition = remoteType
      ? {
          some: {
            isActive: true,
            OR: [
              { remoteType: { equals: remoteType, mode: "insensitive" } },
              { remoteType: { contains: remoteType, mode: "insensitive" } },
            ],
          },
        }
      : { some: { isActive: true } };

    const companies = await prisma.company.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { jobPositions: jobPositionsCondition },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoPath: true,
        latitude: true,
        longitude: true,
        state: true,
        district: true,
        _count: {
          select: {
            jobPositions: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Transform to match expected format
    const formattedCompanies = companies.map((company) => ({
      id: company.id,
      name: company.name,
      company_name: company.name,
      description: company.description ?? undefined,
      logoPath: company.logoPath,
      logoUrl: company.logoPath,
      lat: parseFloat(company.latitude),
      lon: parseFloat(company.longitude),
      latitude: parseFloat(company.latitude),
      longitude: parseFloat(company.longitude),
      state: company.state,
      district: company.district,
      jobCount: company._count.jobPositions,
    }));

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch companies",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
