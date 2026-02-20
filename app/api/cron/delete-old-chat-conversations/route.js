import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/delete-old-chat-conversations
 * Deletes chat conversations older than 1 month (retention: keep 1 week, delete after 1 month).
 * Should be called daily by Vercel Cron.
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

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const deleted = await prisma.conversation.deleteMany({
      where: { createdAt: { lt: oneMonthAgo } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting old chat conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete old chat conversations",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
