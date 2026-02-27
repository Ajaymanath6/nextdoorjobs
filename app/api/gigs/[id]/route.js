import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/getCurrentUser";
import { gigService } from "../../../../lib/services/gig.service";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/gigs/[id]
 * Return a single gig by id with user, portfolio images, and reviews (for profile modal).
 * Public read (no auth required).
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: "Invalid gig ID" }, { status: 400 });
    }

    const gig = await prisma.gig.findUnique({
      where: { id: idNum },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarId: true,
            avatarUrl: true,
            phone: true,
            phoneVisibleToRecruiters: true,
          },
        },
        portfolioImages: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, imageUrl: true, caption: true, orderIndex: true },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!gig) {
      return NextResponse.json({ success: false, error: "Gig not found" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.id === gig.userId;
    const showPhone = gig.user?.phoneVisibleToRecruiters && gig.user?.phone;

    const response = {
      ...gig,
      isOwner: currentUser?.id === gig.userId,
      user: gig.user
        ? {
            ...gig.user,
            email: isOwner || gig.user.email ? gig.user.email : undefined,
            phone: showPhone ? gig.user.phone : undefined,
          }
        : gig.user,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("GET /api/gigs/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load gig" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gigs/[id]
 * Update a gig. Only the owner can update.
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: "Invalid gig ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await gigService.updateGig(idNum, user.id, body);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Gig not found or you are not the owner" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, gig: result });
  } catch (err) {
    console.error("PATCH /api/gigs/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update gig" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gigs/[id]
 * Delete a gig. Only the owner can delete.
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: "Invalid gig ID" }, { status: 400 });
    }

    const result = await gigService.deleteGig(idNum, user.id);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Gig not found or you are not the owner" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error("DELETE /api/gigs/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete gig" },
      { status: 500 }
    );
  }
}
