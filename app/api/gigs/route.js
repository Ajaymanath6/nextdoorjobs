import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/getCurrentUser";
import { gigService } from "../../../lib/services/gig.service";
import { prisma } from "../../../lib/prisma";

/**
 * POST /api/gigs
 * Create a gig for the current user (Individual). Auth via getCurrentUser.
 * Body: title, description?, serviceType, state, district, pincode?, locality?, latitude?, longitude?
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      description,
      serviceType,
      expectedSalary,
      experienceWithGig,
      customersTillDate,
      state,
      district,
      pincode,
      locality,
      latitude,
      longitude,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }
    if (!serviceType || typeof serviceType !== "string" || !serviceType.trim()) {
      return NextResponse.json(
        { success: false, error: "Service type is required" },
        { status: 400 }
      );
    }
    if (!state || typeof state !== "string" || !state.trim()) {
      return NextResponse.json(
        { success: false, error: "State is required" },
        { status: 400 }
      );
    }
    if (!district || typeof district !== "string" || !district.trim()) {
      return NextResponse.json(
        { success: false, error: "District is required" },
        { status: 400 }
      );
    }

    // Prepare data for service
    const gigData = {
      title: title.trim(),
      description: description != null && String(description).trim() !== "" ? String(description).trim() : null,
      serviceType: serviceType.trim(),
      expectedSalary: expectedSalary != null && String(expectedSalary).trim() !== "" ? String(expectedSalary).trim() : null,
      experienceWithGig: experienceWithGig != null && String(experienceWithGig).trim() !== "" ? String(experienceWithGig).trim() : null,
      customersTillDate: (() => {
        if (typeof customersTillDate === "number" && Number.isInteger(customersTillDate) && customersTillDate >= 0) return customersTillDate;
        if (typeof customersTillDate === "string" && /^\d+$/.test(customersTillDate.trim())) return parseInt(customersTillDate.trim(), 10);
        return null;
      })(),
      state: state.trim(),
      district: district.trim(),
      pincode: pincode != null && String(pincode).trim() !== "" ? String(pincode).trim() : null,
      locality: locality != null && String(locality).trim() !== "" ? String(locality).trim() : null,
      latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null,
      longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null,
    };

    // Use service layer
    const gig = await gigService.createGig(user.id, gigData);

    return NextResponse.json({ success: true, gig });
  } catch (err) {
    console.error("POST /api/gigs error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create gig" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gigs
 * List gigs with optional location filter: state, district, pincode.
 * Returns gigs with user (avatarId, avatarUrl, name) for map markers.
 * For Company accounts, returns job seekers instead of gig workers.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");

    if (mine === "1") {
      const user = await getCurrentUser();
      if (!user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      // Use service layer with caching
      const gigs = await gigService.getUserGigs(user.id);
      return NextResponse.json({ success: true, gigs });
    }

    // Check if requesting user is a Company
    const currentUser = await getCurrentUser();
    
    // If Company account, return job seekers and companies with jobs
    if (currentUser && currentUser.accountType === "Company") {
      const filters = {
        state: searchParams.get("state"),
        district: searchParams.get("district"),
        pincode: searchParams.get("pincode"),
      };

      try {
        // Fetch job seekers: opted in (isJobSeeker) and have either home location or at least one gig with coordinates
        const whereClause = {
          accountType: "Individual",
          isJobSeeker: true,
          OR: [
            { homeLatitude: { not: null }, homeLongitude: { not: null } },
            { gigs: { some: { latitude: { not: null }, longitude: { not: null } } } },
          ],
        };

        if (filters.state) whereClause.homeState = filters.state;
        if (filters.district) whereClause.homeDistrict = filters.district;

        const jobSeekers = await prisma.user.findMany({
          where: whereClause,
          include: {
            resume: {
              include: {
                workExperiences: { orderBy: { orderIndex: "asc" } },
                educations: { orderBy: { orderIndex: "asc" } },
              },
            },
            gigs: {
              where: { latitude: { not: null }, longitude: { not: null } },
              orderBy: { id: "asc" },
              take: 1,
            },
          },
        });

        // Transform: use home coords if set, else first gig's coords; only include if we have valid lat/lon
        const transformedJobSeekers = jobSeekers
          .map((seeker) => {
            const lat = seeker.homeLatitude ?? seeker.gigs?.[0]?.latitude;
            const lon = seeker.homeLongitude ?? seeker.gigs?.[0]?.longitude;
            if (lat == null || lon == null) return null;
            return {
              id: seeker.id,
              title: seeker.name,
              serviceType: "Job Seeker",
              state: seeker.homeState ?? seeker.gigs?.[0]?.state ?? null,
              district: seeker.homeDistrict ?? seeker.gigs?.[0]?.district ?? null,
              locality: seeker.homeLocality ?? seeker.gigs?.[0]?.locality ?? null,
              latitude: lat,
              longitude: lon,
              user: {
                id: seeker.id,
                name: seeker.name,
                avatarId: seeker.avatarId,
                avatarUrl: seeker.avatarUrl,
              },
              jobSeekerSkills: seeker.jobSeekerSkills,
              jobSeekerExperience: seeker.jobSeekerExperience,
              resume: seeker.resume || null,
              email: seeker.email,
            };
          })
          .filter(Boolean);

        // Also fetch companies with active job postings
        const companyWhereClause = {
          latitude: { not: null },
          longitude: { not: null },
          jobPositions: {
            some: {
              isActive: true,
            },
          },
        };

        if (filters.state) companyWhereClause.state = filters.state;
        if (filters.district) companyWhereClause.district = filters.district;

        const companies = await prisma.company.findMany({
          where: companyWhereClause,
          include: {
            jobPositions: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        });

        return NextResponse.json({
          success: true,
          gigs: transformedJobSeekers,
          companies: companies.map((c) => ({
            id: c.id,
            name: c.name,
            company_name: c.name,
            latitude: c.latitude,
            longitude: c.longitude,
            state: c.state,
            district: c.district,
            logoUrl: c.logoPath,
            logoPath: c.logoPath,
            jobCount: c.jobPositions.length,
            type: "Company",
          })),
          isJobSeekerMode: true,
        });
      } catch (err) {
        console.error("GET /api/gigs Company branch error:", process.env.NODE_ENV === "development" ? err?.message : "see server logs");
        // Fallback: job seekers with home location only (no gig fallback), so map never 500s
        const fallbackWhere = {
          accountType: "Individual",
          isJobSeeker: true,
          homeLatitude: { not: null },
          homeLongitude: { not: null },
        };
        if (filters.state) fallbackWhere.homeState = filters.state;
        if (filters.district) fallbackWhere.homeDistrict = filters.district;

        let fallbackSeekers = [];
        try {
          fallbackSeekers = await prisma.user.findMany({
            where: fallbackWhere,
            include: {
              resume: {
                include: {
                  workExperiences: { orderBy: { orderIndex: "asc" } },
                  educations: { orderBy: { orderIndex: "asc" } },
                },
              },
            },
          });
        } catch (fallbackErr) {
          console.error("GET /api/gigs fallback job seekers error:", fallbackErr?.message);
        }

        const transformed = fallbackSeekers.map((seeker) => ({
          id: seeker.id,
          title: seeker.name,
          serviceType: "Job Seeker",
          state: seeker.homeState,
          district: seeker.homeDistrict,
          locality: seeker.homeLocality,
          latitude: seeker.homeLatitude,
          longitude: seeker.homeLongitude,
          user: {
            id: seeker.id,
            name: seeker.name,
            avatarId: seeker.avatarId,
            avatarUrl: seeker.avatarUrl,
          },
          jobSeekerSkills: seeker.jobSeekerSkills,
          jobSeekerExperience: seeker.jobSeekerExperience,
          resume: seeker.resume || null,
          email: seeker.email,
        }));

        let companies = [];
        try {
          const companyWhereClause = {
            latitude: { not: null },
            longitude: { not: null },
            jobPositions: { some: { isActive: true } },
          };
          if (filters.state) companyWhereClause.state = filters.state;
          if (filters.district) companyWhereClause.district = filters.district;
          companies = await prisma.company.findMany({
            where: companyWhereClause,
            include: {
              jobPositions: { where: { isActive: true }, select: { id: true } },
            },
          });
        } catch (e) {
          console.error("GET /api/gigs fallback companies error:", e?.message);
        }

        return NextResponse.json({
          success: true,
          gigs: transformed,
          companies: companies.map((c) => ({
            id: c.id,
            name: c.name,
            company_name: c.name,
            latitude: c.latitude,
            longitude: c.longitude,
            state: c.state,
            district: c.district,
            logoUrl: c.logoPath,
            logoPath: c.logoPath,
            jobCount: c.jobPositions?.length ?? 0,
            type: "Company",
          })),
          isJobSeekerMode: true,
        });
      }
    }

    // For non-Company accounts, return regular gigs
    const filters = {
      state: searchParams.get("state"),
      district: searchParams.get("district"),
      pincode: searchParams.get("pincode"),
    };

    // Use service layer with caching
    const gigs = await gigService.getGigsByLocation(filters);
    return NextResponse.json({ success: true, gigs });
  } catch (err) {
    console.error("GET /api/gigs error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to list gigs" },
      { status: 500 }
    );
  }
}
