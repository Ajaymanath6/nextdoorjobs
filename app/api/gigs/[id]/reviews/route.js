import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";
import { prisma } from "../../../../../lib/prisma";

/**
 * POST /api/gigs/[id]/reviews
 * Add or update a review for a gig. Signed-in user only; cannot review own gig.
 * Body: { rating: number (1-5), comment?: string }
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const gigId = Number(id);
    if (Number.isNaN(gigId) || gigId < 1) {
      return NextResponse.json({ success: false, error: "Invalid gig ID" }, { status: 400 });
    }

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { id: true, userId: true },
    });
    if (!gig) {
      return NextResponse.json({ success: false, error: "Gig not found" }, { status: 404 });
    }
    if (gig.userId === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot review your own gig" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rating = typeof body.rating === "number" ? body.rating : parseInt(body.rating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer from 1 to 5" },
        { status: 400 }
      );
    }
    const comment = typeof body.comment === "string" ? body.comment.trim() || null : null;

    const review = await prisma.gigReview.upsert({
      where: {
        gigId_reviewerUserId: { gigId, reviewerUserId: user.id },
      },
      create: { gigId, reviewerUserId: user.id, rating, comment },
      update: { rating, comment },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("POST /api/gigs/[id]/reviews error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save review" },
      { status: 500 }
    );
  }
}
