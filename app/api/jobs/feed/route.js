import { NextResponse } from "next/server";
import { activeJobWhere } from "../../../../lib/jobExpiry";
import { prisma } from "../../../../lib/prisma";

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
  if (remoteType) {
    conditions.push({
      OR: [
        { remoteType: { equals: remoteType, mode: "insensitive" } },
        { remoteType: { contains: remoteType, mode: "insensitive" } },
      ],
    });
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

async function findJobsWithRetry(query, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.jobPosition.findMany(query);
    } catch (err) {
      lastError = err;
      const isTimeout =
        err?.code === "ETIMEDOUT" ||
        (err?.message && String(err.message).includes("ETIMEDOUT"));
      if (!isTimeout || attempt === maxAttempts) throw err;
      console.warn(
        `[GET /api/jobs/feed] timeout attempt ${attempt}/${maxAttempts}, retrying...`
      );
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}

/**
 * GET /api/jobs/feed
 * Flat list of active jobs with company info (Home list view).
 * Same filter params as GET /api/companies, plus optional q (title/company search).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const industryCategory = searchParams.get("category")?.trim() || null;
    const titleFilter = searchParams.get("title")?.trim() || null;
    const q = searchParams.get("q")?.trim() || null;

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
          "[GET /api/jobs/feed] job titles lookup failed:",
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

    if (q) {
      jobMatch.AND.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { jobDescription: { contains: q, mode: "insensitive" } },
          { company: { name: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    const companyFunding = searchParams.get("companyFunding")?.trim();
    const fundingFilter =
      companyFunding && FUNDING_MAP[companyFunding]
        ? { fundingSeries: { in: FUNDING_MAP[companyFunding] } }
        : {};

    const jobs = await findJobsWithRetry({
      where: {
        AND: [
          jobMatch,
          {
            company: {
              AND: [
                { latitude: { not: null } },
                { longitude: { not: null } },
                ...(Object.keys(fundingFilter).length ? [fundingFilter] : []),
              ],
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
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
        assistRelocation: true,
        seniorityLevel: true,
        teamSize: true,
        perks: true,
        holidays: true,
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
    });

    const formatted = jobs.map((job) => {
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
        assistRelocation: job.assistRelocation,
        seniorityLevel: job.seniorityLevel,
        teamSize: job.teamSize,
        perks: job.perks,
        holidays: job.holidays,
        applicationUrl: job.applicationUrl,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
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
      jobs: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error("Error fetching jobs feed:", error);
    const isTimeout =
      error?.code === "ETIMEDOUT" ||
      (error?.message && String(error.message).includes("ETIMEDOUT"));
    if (isTimeout) {
      return NextResponse.json({
        success: true,
        jobs: [],
        total: 0,
        warning: "Database temporarily unavailable; try again shortly",
      });
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
