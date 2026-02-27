import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";
import { prisma } from "../../../../../lib/prisma";

/**
 * POST /api/gigs/[id]/portfolio
 * Add a portfolio image URL to a gig. Gig owner only.
 * Body: { imageUrl: string } (e.g. from /api/profile/avatar/upload)
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

    const gig = await prisma.gig.findFirst({
      where: { id: gigId, userId: user.id },
      select: { id: true },
    });
    if (!gig) {
      return NextResponse.json(
        { success: false, error: "Gig not found or you are not the owner" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!imageUrl || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
      return NextResponse.json(
        { success: false, error: "Valid imageUrl (HTTP/HTTPS) is required" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.gigPortfolioImage.aggregate({
      where: { gigId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const image = await prisma.gigPortfolioImage.create({
      data: { gigId, imageUrl, orderIndex },
    });

    return NextResponse.json({ success: true, image });
  } catch (err) {
    console.error("POST /api/gigs/[id]/portfolio error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to add image" },
      { status: 500 }
    );
  }
}
