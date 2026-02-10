import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/getCurrentUser";

/**
 * POST /api/onboarding/conversation
 * Store one Q&A pair for an onboarding session.
 * Body: { sessionId: number, stepKey: string, questionText: string, answerText: string, orderIndex: number }
 */
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, stepKey, questionText, answerText, orderIndex } = body;

    if (
      sessionId === undefined ||
      sessionId === null ||
      stepKey === undefined ||
      stepKey === null ||
      questionText === undefined ||
      answerText === undefined ||
      orderIndex === undefined ||
      orderIndex === null
    ) {
      return NextResponse.json(
        { error: "sessionId, stepKey, questionText, answerText, and orderIndex are required" },
        { status: 400 }
      );
    }

    const session = await prisma.onboardingSession.findUnique({
      where: { id: parseInt(sessionId, 10) },
      select: { userId: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Session does not belong to the current user" },
        { status: 403 }
      );
    }

    const conversation = await prisma.onboardingConversation.create({
      data: {
        onboardingSessionId: parseInt(sessionId, 10),
        stepKey: String(stepKey).slice(0, 100),
        questionText: String(questionText),
        answerText: String(answerText),
        orderIndex: parseInt(orderIndex, 10),
      },
    });

    return NextResponse.json({
      success: true,
      id: conversation.id,
    });
  } catch (error) {
    console.error("Error in onboarding conversation API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
