import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/getCurrentUser";
import { encrypt, decrypt } from "../../../../../lib/chatEncryption";
import { broadcastNewMessage } from "../../../../../lib/socket";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/chat/conversations/[id]/messages
 * Paginated messages for a conversation. Decrypt in API.
 * Query: cursor (optional message id), limit (default 50, max 100)
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const resolvedParams = await params;
    const conversationId = parseInt(resolvedParams.id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { recruiterId: true, candidateId: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.recruiterId !== user.id && conversation.candidateId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: parseInt(cursor, 10) }, skip: 1 } : {}),
      select: { id: true, senderId: true, bodyEncrypted: true, createdAt: true },
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;

    const decrypted = page.map((m) => {
      let body = null;
      try {
        body = decrypt(m.bodyEncrypted);
      } catch {
        body = "[unable to decrypt]";
      }
      return {
        id: m.id,
        senderId: m.senderId,
        body,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      messages: decrypted,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error("Error in GET /api/chat/conversations/[id]/messages:", error);
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations/[id]/messages
 * Add a message. Body: { body: string }. Encrypt and save.
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const resolvedParams = await params;
    const conversationId = parseInt(resolvedParams.id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { recruiterId: true, candidateId: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.recruiterId !== user.id && conversation.candidateId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const text = body.body != null ? String(body.body).trim() : "";
    if (!text) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    const encrypted = encrypt(text);
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        bodyEncrypted: encrypted,
      },
      select: { id: true, senderId: true, createdAt: true },
    });

    const response = {
      id: message.id,
      senderId: message.senderId,
      body: text,
      createdAt: message.createdAt,
    };

    try {
      broadcastNewMessage(conversationId, response);
    } catch (err) {
      console.error("WebSocket broadcast error:", err);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in POST /api/chat/conversations/[id]/messages:", error);
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}
