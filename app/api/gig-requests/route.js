import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/getCurrentUser";
import { prisma } from "../../../lib/prisma";
import { sendGigRequestNotificationEmail } from "../../../lib/email";
import { SERVICE_TYPES } from "../../../lib/constants/serviceTypes";

/**
 * POST /api/gig-requests
 * Create a gig request and email gig workers in that category.
 * Auth: signed-in user with accountType === "Individual".
 * Body: category, title, description, deadline? (ISO string), location?
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "Individual") {
      return NextResponse.json(
        { success: false, error: "Only Individual (job seeker / gig worker) accounts can request a gig." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { category, title, description, deadline, location } = body;

    const categoryTrimmed = typeof category === "string" ? category.trim() : "";
    if (!categoryTrimmed) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }
    if (!SERVICE_TYPES.includes(categoryTrimmed)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    const titleTrimmed = typeof title === "string" ? title.trim() : "";
    if (!titleTrimmed) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const descriptionTrimmed = typeof description === "string" ? description.trim() : "";
    if (!descriptionTrimmed) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    let deadlineDate = null;
    if (deadline != null && deadline !== "") {
      const d = new Date(deadline);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid deadline date" },
          { status: 400 }
        );
      }
      deadlineDate = d;
    }

    const locationTrimmed =
      location != null && typeof location === "string" && location.trim() !== ""
        ? location.trim()
        : null;

    await prisma.gigRequest.create({
      data: {
        userId: user.id,
        category: categoryTrimmed,
        title: titleTrimmed,
        description: descriptionTrimmed,
        deadline: deadlineDate,
        location: locationTrimmed,
      },
    });

    const gigsInCategory = await prisma.gig.findMany({
      where: { serviceType: categoryTrimmed },
      select: { userId: true, user: { select: { id: true, email: true, name: true } } },
    });

    const seen = new Set();
    const recipients = [];
    for (const g of gigsInCategory) {
      if (g.userId === user.id) continue;
      const email = g.user?.email;
      if (!email || seen.has(email.toLowerCase())) continue;
      seen.add(email.toLowerCase());
      recipients.push({
        email,
        name: g.user?.name || "Gig worker",
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    const appUrlClean = appUrl.replace(/\/$/, "");

    const deadlineFormatted = deadlineDate
      ? deadlineDate.toLocaleDateString(undefined, {
          dateStyle: "medium",
          timeStyle: deadlineDate.getHours() || deadlineDate.getMinutes() ? "short" : undefined,
        })
      : null;

    for (const r of recipients) {
      await sendGigRequestNotificationEmail({
        recipientEmail: r.email,
        recipientName: r.name,
        requesterName: user.name || "Someone",
        requesterEmail: user.email || undefined,
        category: categoryTrimmed,
        title: titleTrimmed,
        description: descriptionTrimmed,
        deadline: deadlineFormatted,
        appUrl: appUrlClean,
      });
    }

    return NextResponse.json({
      success: true,
      recipientsCount: recipients.length,
    });
  } catch (error) {
    console.error("POST /api/gig-requests error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
