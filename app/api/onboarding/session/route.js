import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

/**
 * POST /api/onboarding/session
 * Create a new onboarding session for the current user.
 * Ensures User has clerkId/avatarUrl if authenticated via Clerk.
 * Returns { sessionId, user }.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    if (clerkUser) {
      const clerkId = clerkUser.id;
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { avatarUrl: true },
      });
      const updateData = { clerkId };
      // Only set avatarUrl from Clerk when user has none (e.g. first time). Never overwrite
      // a user-chosen avatar (from Settings) with Clerk's imageUrl.
      if (!existing?.avatarUrl?.trim()) {
        const fromClerk = clerkUser.imageUrl?.trim() || null;
        if (fromClerk) updateData.avatarUrl = fromClerk;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    const session = await prisma.onboardingSession.create({
      data: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error in onboarding session API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding/session
 * Update session with companyId and jobPositionId when flow completes.
 * Body: { sessionId: number, companyId?: number, jobPositionId?: number }
 */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, companyId, jobPositionId } = body;

    if (sessionId === undefined || sessionId === null) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const session = await prisma.onboardingSession.findUnique({
      where: { id: parseInt(sessionId, 10) },
      select: { userId: true },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const updateData = {};
    if (companyId !== undefined && companyId !== null) {
      updateData.companyId = parseInt(companyId, 10);
    }
    if (jobPositionId !== undefined && jobPositionId !== null) {
      updateData.jobPositionId = parseInt(jobPositionId, 10);
    }
    if (Object.keys(updateData).length > 0) {
      updateData.completedAt = new Date();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.onboardingSession.update({
        where: { id: parseInt(sessionId, 10) },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in onboarding session PATCH:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
