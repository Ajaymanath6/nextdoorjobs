import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";

/**
 * GET /api/onboarding/company/[id]
 * Returns company by id. Only allowed when the company belongs to the current user.
 * Used to resolve logoPath for the map when onboarding state does not have it.
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const id = parseInt(params?.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid company id" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logoPath: true,
        websiteUrl: true,
        fundingSeries: true,
        latitude: true,
        longitude: true,
        state: true,
        district: true,
        pincode: true,
        userId: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    if (company.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { userId, ...companyWithoutUserId } = company;
    return NextResponse.json({
      company: companyWithoutUserId,
    });
  } catch (error) {
    console.error("GET company by id error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
