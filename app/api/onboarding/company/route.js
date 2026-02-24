import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { handleFileUpload } from "../../../../lib/fileUpload";
import { companyService } from "../../../../lib/services/company.service";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

/**
 * POST /api/onboarding/company
 * Create a new company with logo upload
 * Body: FormData with:
 *   - name: string
 *   - description: string (optional)
 *   - logo: File (optional)
 *   - websiteUrl: string (optional)
 *   - fundingSeries: string (optional)
 *   - latitude: number
 *   - longitude: number
 *   - state: string
 *   - district: string
 *   - pincode: string (optional)
 *   - userId: number
 */
export async function POST(request) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name");
    const description = formData.get("description");
    const websiteUrl = formData.get("websiteUrl");
    const fundingSeries = formData.get("fundingSeries");
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const state = formData.get("state");
    const district = formData.get("district");
    const pincode = formData.get("pincode");
    const userId = formData.get("userId");

    // Validation
    if (!name || !state || !district || !userId) {
      return NextResponse.json(
        { success: false, error: "Name, state, district, and userId are required" },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(String(userId), 10);
    if (Number.isNaN(userIdNum) || userIdNum < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid user. Please sign in again." },
        { status: 400 }
      );
    }

    // Validate userId exists (wrap in try/catch so connection/Prisma errors return safe 500)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userIdNum },
      });
    } catch (dbError) {
      const message = dbError?.message || String(dbError);
      if (process.env.NODE_ENV === "development") {
        console.error("Company API: user lookup failed", message);
      } else {
        console.error("Company API: user lookup failed");
      }
      return NextResponse.json(
        { success: false, error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Please complete onboarding sign-in first." },
        { status: 404 }
      );
    }

    // Handle logo upload if provided, or use logoUrl if provided
    let logoPath = null;
    const logoFile = formData.get("logo");
    const logoUrl = formData.get("logoUrl");
    
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const uploadResult = await handleFileUpload(formData, "logo");
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || "Failed to upload logo" },
          { status: 400 }
        );
      }
      logoPath = uploadResult.path;
    } else if (logoUrl && typeof logoUrl === "string" && logoUrl.trim()) {
      // Use the fetched logo URL directly
      logoPath = logoUrl.trim();
    }

    const nameStr = name.toString();

    // Idempotent: return existing company if same user and name
    const existing = await companyService.findCompanyByUserAndName(userIdNum, nameStr);
    let company;
    
    if (existing) {
      // Update logo and/or description if provided
      const updateData = {};
      if (logoPath) updateData.logoPath = logoPath;
      if (description !== null && description !== undefined) updateData.description = String(description).trim() || null;
      if (Object.keys(updateData).length > 0) {
        company = await companyService.updateCompany(existing.id, updateData);
      } else {
        company = existing;
      }
    } else {
      // Create new company using CompanyService
      try {
        company = await companyService.createCompany(userIdNum, {
          name: nameStr,
          description: description != null ? String(description) : null,
          logoPath,
          websiteUrl,
          fundingSeries,
          latitude,
          longitude,
          state,
          district,
          pincode,
        });
      } catch (serviceError) {
        return NextResponse.json(
          { success: false, error: serviceError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        description: company.description ?? undefined,
        logoPath: company.logoPath,
        websiteUrl: company.websiteUrl,
        fundingSeries: company.fundingSeries,
        latitude: company.latitude,
        longitude: company.longitude,
        state: company.state,
        district: company.district,
        pincode: company.pincode,
      },
      message: existing ? "Company already exists" : "Company created successfully",
    });
  } catch (error) {
    console.error("Error in company API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onboarding/company
 * Get all companies for the current user
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const companies = await prisma.company.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
