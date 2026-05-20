import { NextResponse } from "next/server";
import { expireStaleJobs } from "../../../../lib/jobExpiry";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/cron/delete-expired-jobs
 * Cron job to soft-delete expired job postings (Vercel Cron daily).
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedAuth = process.env.CRON_SECRET
      ? `Bearer ${process.env.CRON_SECRET}`
      : null;

    if (expectedAuth && authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const { count } = await expireStaleJobs(prisma, { allActive: false, now });

    console.log(`Auto-deleted ${count} expired job postings`);

    return NextResponse.json({
      success: true,
      deletedCount: count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error deleting expired jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete expired jobs",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
