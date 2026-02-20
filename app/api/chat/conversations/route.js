import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";
import { decrypt } from "../../../../lib/chatEncryption";

/**
 * POST /api/chat/conversations
 * Find or create a conversation between current user (recruiter) and candidateId.
 * Body: { candidateId: number }
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const candidateId = body.candidateId != null ? parseInt(String(body.candidateId), 10) : NaN;
    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        recruiterId_candidateId: { recruiterId: user.id, candidateId },
      },
      create: { recruiterId: user.id, candidateId },
      update: {},
      select: { id: true },
    });

    return NextResponse.json({ id: conversation.id });
  } catch (error) {
    console.error("Error in POST /api/chat/conversations:", error);
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/conversations
 * List conversations for current user (recruiter) with last message preview and candidate summary.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { recruiterId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        candidateId: true,
        updatedAt: true,
        candidate: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { bodyEncrypted: true, senderId: true, createdAt: true },
        },
      },
    });

    const list = conversations.map((c) => {
      const last = c.messages[0];
      let preview = null;
      if (last) {
        try {
          preview = decrypt(last.bodyEncrypted);
          if (preview && preview.length > 80) preview = preview.slice(0, 80) + "\u2026";
        } catch {
          preview = "[encrypted]";
        }
      }
      return {
        id: c.id,
        candidateId: c.candidateId,
        candidateName: c.candidate?.name ?? null,
        updatedAt: c.updatedAt,
        lastMessagePreview: preview,
        lastMessageAt: last?.createdAt ?? null,
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error in GET /api/chat/conversations:", error);
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}
