import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

/**
 * GET /api/notifications
 * List notifications for current user
 * Query params: ?unreadOnly=true (optional)
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where = { userId: user.id };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        conversationId: true,
        senderId: true,
        senderName: true,
        senderEmail: true,
        senderOrgName: true,
        isRead: true,
        createdAt: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/mark-read
 * Mark notification(s) as read
 * Body: { notificationIds: [1, 2, 3] } or { markAll: true }
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { notificationIds, markAll } = body;

    let where = { userId: user.id };

    if (markAll) {
      where.isRead = false;
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      where.id = { in: notificationIds };
    } else {
      return NextResponse.json({ error: "notificationIds array or markAll flag required" }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error in POST /api/notifications/mark-read:", error);
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}
