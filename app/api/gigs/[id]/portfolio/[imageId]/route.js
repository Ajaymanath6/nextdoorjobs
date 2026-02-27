import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/getCurrentUser";
import { prisma } from "../../../../../../lib/prisma";

/**
 * DELETE /api/gigs/[id]/portfolio/[imageId]
 * Remove a portfolio image. Gig owner only.
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, imageId } = await params;
    const gigId = Number(id);
    const imageIdNum = Number(imageId);
    if (Number.isNaN(gigId) || gigId < 1 || Number.isNaN(imageIdNum) || imageIdNum < 1) {
      return NextResponse.json({ success: false, error: "Invalid gig or image ID" }, { status: 400 });
    }

    const image = await prisma.gigPortfolioImage.findFirst({
      where: { id: imageIdNum, gig: { userId: user.id } },
      select: { id: true },
    });
    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found or you are not the gig owner" },
        { status: 404 }
      );
    }

    await prisma.gigPortfolioImage.delete({ where: { id: imageIdNum } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error("DELETE /api/gigs/[id]/portfolio/[imageId] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
