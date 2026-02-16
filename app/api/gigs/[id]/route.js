import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/getCurrentUser";
import { gigService } from "../../../../lib/services/gig.service";

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
