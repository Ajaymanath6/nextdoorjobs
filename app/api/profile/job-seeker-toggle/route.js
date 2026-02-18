import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

/**
 * PATCH /api/profile/job-seeker-toggle
 * Toggle job seeker status for gig workers
 */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Individual accounts can be job seekers
    if (user.accountType !== "Individual") {
      return NextResponse.json(
        { error: "Only Individual accounts can enable job seeker mode" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isJobSeeker } = body;

    if (typeof isJobSeeker !== "boolean") {
      return NextResponse.json(
        { error: "isJobSeeker must be a boolean" },
        { status: 400 }
      );
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isJobSeeker },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        isJobSeeker: updated.isJobSeeker,
      },
      message: isJobSeeker 
        ? "You are now visible to companies as a job seeker" 
        : "Job seeker mode disabled"
    });
  } catch (error) {
    console.error("Error toggling job seeker status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update job seeker status",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
