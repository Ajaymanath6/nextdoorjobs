import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/getCurrentUser";
import { authService } from "../../../lib/services/auth.service";
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

    // Check if requesting user is a Company (use same auth as /api/auth/me so map sees candidates)
    let currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      currentUser = await getCurrentUser();
    }

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

        // Only apply location filters if they're provided and not empty
        // Note: These filters apply to home location; gig location filtering happens in the include
        if (filters.state && filters.state.trim()) {
          // Apply state filter to home location branch of OR
          whereClause.OR[0].homeState = filters.state;
          // For gig location branch, filter gigs by state
          whereClause.OR[1] = {
            gigs: {
              some: {
                latitude: { not: null },
                longitude: { not: null },
                state: filters.state,
              },
            },
          };
        }
        if (filters.district && filters.district.trim()) {
          // Apply district filter to home location branch
          whereClause.OR[0].homeDistrict = filters.district;
          // Update gig location branch to include district filter
          if (whereClause.OR[1].gigs && whereClause.OR[1].gigs.some) {
            whereClause.OR[1].gigs.some.district = filters.district;
          } else {
            whereClause.OR[1] = {
              gigs: {
                some: {
                  latitude: { not: null },
                  longitude: { not: null },
                  ...(filters.state && filters.state.trim() ? { state: filters.state } : {}),
                  district: filters.district,
                },
              },
            };
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.log("[GET /api/gigs] Company branch: Fetching job seekers with filters:", filters);
          console.log("[GET /api/gigs] Where clause:", JSON.stringify(whereClause, null, 2));
        }

        const jobSeekers = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phoneVisibleToRecruiters: true,
            avatarId: true,
            avatarUrl: true,
            isJobSeeker: true,
            homeLatitude: true,
            homeLongitude: true,
            homeLocality: true,
            homeDistrict: true,
            homeState: true,
            jobSeekerSkills: true,
            jobSeekerExperience: true,
            candidateKarma: {
              select: { emailClicks: true, chatClicks: true },
            },
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

        if (process.env.NODE_ENV === "development") {
          console.log("[GET /api/gigs] Found job seekers:", jobSeekers.length);
          if (jobSeekers.length > 0) {
            console.log("[GET /api/gigs] Sample seeker:", {
              id: jobSeekers[0].id,
              name: jobSeekers[0].name,
              isJobSeeker: jobSeekers[0].isJobSeeker,
              hasHome: !!(jobSeekers[0].homeLatitude && jobSeekers[0].homeLongitude),
              hasGigs: jobSeekers[0].gigs?.length > 0,
              gigCoords: jobSeekers[0].gigs?.[0] ? { lat: jobSeekers[0].gigs[0].latitude, lon: jobSeekers[0].gigs[0].longitude } : null,
            });
          }
        }

        // Transform: use home coords if set, else first gig's coords; only include if we have valid lat/lon
        const transformedJobSeekers = jobSeekers
          .map((seeker) => {
            const lat = seeker.homeLatitude ?? seeker.gigs?.[0]?.latitude;
            const lon = seeker.homeLongitude ?? seeker.gigs?.[0]?.longitude;
            if (process.env.NODE_ENV === "development" && (lat == null || lon == null)) {
              console.log("[GET /api/gigs] Skipping seeker (no coords):", {
                id: seeker.id,
                name: seeker.name,
                homeLat: seeker.homeLatitude,
                homeLon: seeker.homeLongitude,
                gigsCount: seeker.gigs?.length || 0,
                firstGigLat: seeker.gigs?.[0]?.latitude,
                firstGigLon: seeker.gigs?.[0]?.longitude,
              });
            }
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
                phone: seeker.phone ?? null,
                phoneVisibleToRecruiters: seeker.phoneVisibleToRecruiters ?? false,
              },
              jobSeekerSkills: seeker.jobSeekerSkills,
              jobSeekerExperience: seeker.jobSeekerExperience,
              resume: seeker.resume || null,
              email: seeker.email,
              karmaScore: (seeker.candidateKarma?.emailClicks || 0) + (seeker.candidateKarma?.chatClicks || 0),
            };
          })
          .filter(Boolean);

        if (process.env.NODE_ENV === "development") {
          console.log("[GET /api/gigs] Transformed candidates with location:", transformedJobSeekers.length);
        }

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
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              phoneVisibleToRecruiters: true,
              avatarId: true,
              avatarUrl: true,
              isJobSeeker: true,
              homeLatitude: true,
              homeLongitude: true,
              homeLocality: true,
              homeDistrict: true,
              homeState: true,
              jobSeekerSkills: true,
              jobSeekerExperience: true,
              candidateKarma: {
                select: { emailClicks: true, chatClicks: true },
              },
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
            phone: seeker.phone ?? null,
            phoneVisibleToRecruiters: seeker.phoneVisibleToRecruiters ?? false,
          },
          jobSeekerSkills: seeker.jobSeekerSkills,
          jobSeekerExperience: seeker.jobSeekerExperience,
          resume: seeker.resume || null,
          email: seeker.email,
          karmaScore: (seeker.candidateKarma?.emailClicks || 0) + (seeker.candidateKarma?.chatClicks || 0),
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
