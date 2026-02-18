import { NextResponse } from "next/server";
import { companyService } from "../../../../../../lib/services/company.service";
import { getCurrentUser } from "../../../../../../lib/getCurrentUser";
import { prisma } from "../../../../../../lib/prisma";

/**
 * PATCH /api/onboarding/company/[id]/location
 * Update company location
 * Body: JSON with:
 *   - latitude: number (optional)
 *   - longitude: number (optional)
 *   - state: string (required)
 *   - district: string (required)
 *   - pincode: string (optional)
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

    const body = await request.json();
    const { latitude, longitude, state, district, pincode } = body;

    // Validate required fields
    if (!state || !district) {
      return NextResponse.json(
        { success: false, error: "State and district are required" },
        { status: 400 }
      );
    }

    // Update company location using service
    try {
      const updatedCompany = await companyService.updateCompanyLocation(companyId, {
        latitude,
        longitude,
        state,
        district,
        pincode,
      });

      return NextResponse.json({
        success: true,
        company: updatedCompany,
        message: "Company location updated successfully",
      });
    } catch (serviceError) {
      return NextResponse.json(
        { success: false, error: serviceError.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating company location:", error);
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
