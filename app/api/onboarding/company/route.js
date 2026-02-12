import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { handleFileUpload } from "../../../../lib/fileUpload";

/**
 * POST /api/onboarding/company
 * Create a new company with logo upload
 * Body: FormData with:
 *   - name: string
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

    // Validate coordinates
    const lat = latitude ? parseFloat(latitude) : null;
    const lon = longitude ? parseFloat(longitude) : null;
    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      return NextResponse.json(
        { error: "Invalid latitude. Must be between -90 and 90" },
        { status: 400 }
      );
    }
    if (lon !== null && (isNaN(lon) || lon < -180 || lon > 180)) {
      return NextResponse.json(
        { error: "Invalid longitude. Must be between -180 and 180" },
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

    // Handle logo upload if provided
    let logoPath = null;
    const logoFile = formData.get("logo");
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const uploadResult = await handleFileUpload(formData, "logo");
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || "Failed to upload logo" },
          { status: 400 }
        );
      }
      logoPath = uploadResult.path;
    }

    // Validate funding series if provided
    const validFundingSeries = [
      "Seed",
      "SeriesA",
      "SeriesB",
      "SeriesC",
      "SeriesD",
      "SeriesE",
      "IPO",
      "Bootstrapped",
    ];
    const fundingSeriesValue =
      fundingSeries && validFundingSeries.includes(fundingSeries)
        ? fundingSeries
        : null;

    // Validate website URL format if provided
    let websiteUrlValue = null;
    if (websiteUrl && websiteUrl.toString().trim()) {
      const urlString = websiteUrl.toString().trim();
      // Basic URL validation
      try {
        // Add protocol if missing
        const urlWithProtocol = urlString.startsWith("http://") || urlString.startsWith("https://")
          ? urlString
          : `https://${urlString}`;
        new URL(urlWithProtocol);
        websiteUrlValue = urlWithProtocol;
      } catch (urlError) {
        return NextResponse.json(
          { error: "Invalid website URL format" },
          { status: 400 }
        );
      }
    }

    const nameStr = name.toString();

    // Idempotent: return existing company if same user and name (e.g. "See your posting" retry)
    const existing = await prisma.company.findFirst({
      where: { userId: userIdNum, name: nameStr.trim() },
    });
    let company;
    if (existing) {
      company = logoPath
        ? await prisma.company.update({
            where: { id: existing.id },
            data: { logoPath },
          })
        : existing;
    } else {
      company = await prisma.company.create({
        data: {
          name: nameStr,
          logoPath,
          websiteUrl: websiteUrlValue,
          fundingSeries: fundingSeriesValue,
          latitude: lat,
          longitude: lon,
          state: state.toString(),
          district: district.toString(),
          pincode: pincode ? pincode.toString() : null,
          userId: userIdNum,
        },
      });
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
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
