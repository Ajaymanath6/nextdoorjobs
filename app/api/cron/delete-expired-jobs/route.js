import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/cron/delete-expired-jobs
 * Cron job to auto-delete expired job postings
 * Should be called daily by Vercel Cron
 */
export async function GET(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const expectedAuth = process.env.CRON_SECRET 
      ? `Bearer ${process.env.CRON_SECRET}` 
      : null;
    
    if (expectedAuth && authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find and soft-delete expired jobs
    const expiredJobs = await prisma.jobPosition.updateMany({
      where: {
        expiresAt: { 
          not: null,
          lt: now 
        },
        isActive: true,
        autoDeletedAt: null,
      },
      data: {
        isActive: false,
        autoDeletedAt: now,
      },
    });

    console.log(`Auto-deleted ${expiredJobs.count} expired job postings`);

    return NextResponse.json({
      success: true,
      deletedCount: expiredJobs.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error deleting expired jobs:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete expired jobs",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
