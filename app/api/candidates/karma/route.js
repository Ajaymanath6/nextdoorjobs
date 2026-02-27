import { NextResponse } from "next/server";
import { authService } from "../../../../lib/services/auth.service";
import { prisma } from "../../../../lib/prisma";

/**
 * POST /api/candidates/karma
 * Record recruiter (Company) interaction with a candidate: email click or chat click.
 * Increments the candidate's karma counters.
 */
export async function POST(request) {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.accountType !== "Company") {
      return NextResponse.json(
        { error: "Only Company accounts can record candidate karma" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const candidateUserId = body.candidateUserId != null ? parseInt(String(body.candidateUserId), 10) : null;
    const action = body.action === "email" ? "email" : body.action === "chat" ? "chat" : null;

    if (!candidateUserId || Number.isNaN(candidateUserId) || !action) {
      return NextResponse.json(
        { error: "Missing or invalid candidateUserId or action (must be 'email' or 'chat')" },
        { status: 400 }
      );
    }

    if (candidateUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot record karma for yourself" },
        { status: 400 }
      );
    }

    const updateField = action === "email" ? "emailClicks" : "chatClicks";
    await prisma.candidateKarma.upsert({
      where: { candidateUserId },
      create: {
        candidateUserId,
        emailClicks: action === "email" ? 1 : 0,
        chatClicks: action === "chat" ? 1 : 0,
      },
      update: {
        [updateField]: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/candidates/karma error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
