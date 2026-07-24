import { NextResponse } from "next/server";
import { activeJobWhere } from "../../../lib/jobExpiry";
import { prisma } from "../../../lib/prisma";
import { remoteTypePrismaOr } from "../../../lib/jobMapFilters";

const FUNDING_MAP = {
  Startup: ["Seed", "Bootstrapped"],
  SME: ["SeriesA", "SeriesB"],
  Enterprise: ["SeriesC", "SeriesD", "SeriesE", "IPO"],
};

function parseIntParam(value) {
  if (value == null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatParam(value) {
  if (value == null || value === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function buildJobMatchConditions(searchParams) {
  const liveJob = activeJobWhere();
  const conditions = [{ ...liveJob }];

  const remoteType = searchParams.get("remoteType")?.trim();
  const remoteOr = remoteTypePrismaOr(remoteType);
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

  const salaryMin = parseIntParam(searchParams.get("salaryMin"));
  const salaryMax = parseIntParam(searchParams.get("salaryMax"));
  if (salaryMin != null || salaryMax != null) {
    const salaryParts = [];
    if (salaryMax != null) {
      salaryParts.push({
        OR: [{ salaryMin: { lte: salaryMax } }, { salaryMin: null }],
      });
    }
    if (salaryMin != null) {
      salaryParts.push({
        OR: [{ salaryMax: { gte: salaryMin } }, { salaryMax: null }],
      });
    }
    if (salaryParts.length) conditions.push({ AND: salaryParts });
  }

  const yearsMin = parseFloatParam(searchParams.get("yearsMin"));
  const yearsMax = parseFloatParam(searchParams.get("yearsMax"));
  if (yearsMin != null) {
    conditions.push({ yearsRequired: { gte: yearsMin } });
  }
  if (yearsMax != null) {
    conditions.push({ yearsRequired: { lte: yearsMax } });
  }

  const postedWithinDays = parseIntParam(searchParams.get("postedWithinDays"));
  if (postedWithinDays != null && postedWithinDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - postedWithinDays);
    conditions.push({ createdAt: { gte: since } });
  }

  return { AND: conditions };
}

/**
 * GET /api/companies
 * Fetch companies with active jobs matching optional filters.
 */
async function findCompaniesWithRetry(query, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.company.findMany(query);
    } catch (err) {
      lastError = err;
      const isTimeout =
        err?.code === "ETIMEDOUT" ||
        (err?.message && String(err.message).includes("ETIMEDOUT"));
      if (!isTimeout || attempt === maxAttempts) throw err;
      console.warn(
        `[GET /api/companies] timeout attempt ${attempt}/${maxAttempts}, retrying...`
      );
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const industryCategory = searchParams.get("category")?.trim() || null;
    const titleFilter = searchParams.get("title")?.trim() || null;

    let titleList = null;
    if (industryCategory && !titleFilter) {
      try {
        const titles = await prisma.jobTitle.findMany({
          where: { category: { equals: industryCategory, mode: "insensitive" } },
          select: { title: true },
        });
        titleList = titles.map((t) => t.title);
      } catch (titleErr) {
        console.warn(
          "[GET /api/companies] job titles lookup failed:",
          titleErr?.code || titleErr?.message
        );
      }
    }

    const jobMatch = buildJobMatchConditions(searchParams);
    if (titleList?.length) {
      jobMatch.AND.push({
        OR: titleList.map((t) => ({
          title: { equals: t, mode: "insensitive" },
        })),
      });
    }

    const companyFunding = searchParams.get("companyFunding")?.trim();
    const fundingFilter =
      companyFunding && FUNDING_MAP[companyFunding]
        ? { fundingSeries: { in: FUNDING_MAP[companyFunding] } }
        : {};

    const companies = await findCompaniesWithRetry({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { jobPositions: { some: jobMatch } },
          ...(Object.keys(fundingFilter).length ? [fundingFilter] : []),
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
              where: jobMatch,
            },
          },
        },
      },
    });

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
    // Soft-fail on DB timeouts / connectivity so the map still renders
    const msg = error?.message ? String(error.message) : "";
    const isTimeout =
      error?.code === "ETIMEDOUT" ||
      error?.code === "P1001" ||
      error?.code === "P1017" ||
      msg.includes("ETIMEDOUT") ||
      msg.toLowerCase().includes("timed out") ||
      msg.toLowerCase().includes("can't reach database");
    if (isTimeout) {
      return NextResponse.json({
        success: true,
        companies: [],
        warning: "Database temporarily unavailable; try again shortly",
      });
    }
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
