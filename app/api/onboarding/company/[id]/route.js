import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { handleFileUpload } from "../../../../../lib/fileUpload";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";

/**
 * GET /api/onboarding/company/[id]
 * Get a specific company by ID
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const companyId = parseInt(resolvedParams.id);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    // Verify user owns this company
    if (company.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
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
 * PATCH /api/onboarding/company/[id]
 * Update a company
 * Body: FormData with optional fields:
 *   - name: string
 *   - logo: File
 *   - websiteUrl: string
 *   - fundingSeries: string
 *   - latitude: number
 *   - longitude: number
 *   - state: string
 *   - district: string
 *   - pincode: string
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const companyId = parseInt(resolvedParams.id);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid company ID" },
        { status: 400 }
      );
    }

    // Verify company exists and user owns it
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    if (existingCompany.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    // Extract fields to update
    const updateData = {};
    
    const name = formData.get("name");
    if (name) updateData.name = name.toString();

    const websiteUrl = formData.get("websiteUrl");
    if (websiteUrl) updateData.websiteUrl = websiteUrl.toString();

    const fundingSeries = formData.get("fundingSeries");
    if (fundingSeries) updateData.fundingSeries = fundingSeries;

    const latitude = formData.get("latitude");
    if (latitude) updateData.latitude = parseFloat(latitude);

    const longitude = formData.get("longitude");
    if (longitude) updateData.longitude = parseFloat(longitude);

    const state = formData.get("state");
    if (state) updateData.state = state.toString();

    const district = formData.get("district");
    if (district) updateData.district = district.toString();

    const pincode = formData.get("pincode");
    if (pincode) updateData.pincode = pincode.toString();

    const description = formData.get("description");
    if (description !== null && description !== undefined) updateData.description = description.toString().trim() || null;

    // Handle logo upload if provided (file)
    const logoFile = formData.get("logo");
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const uploadResult = await handleFileUpload(formData, "logo");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error || "Failed to upload logo" },
          { status: 400 }
        );
      }
      updateData.logoPath = uploadResult.path;
    }
    // Allow setting logoPath to a URL string (e.g. from fetch-logo)
    const logoPathUrl = formData.get("logoPath");
    if (logoPathUrl != null && typeof logoPathUrl === "string" && logoPathUrl.trim()) {
      updateData.logoPath = logoPathUrl.trim();
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: "Company updated successfully",
    });
  } catch (error) {
    console.error("Error updating company:", error);
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
