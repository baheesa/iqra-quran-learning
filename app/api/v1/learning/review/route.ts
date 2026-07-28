import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  const queue = engine.review.syncQueue();
  return NextResponse.json({
    queue,
    candidates: engine.review.buildQueue(),
    dueCount: engine.review.dueCount(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    vocabularyId?: string;
    success?: boolean;
    queueItemId?: string;
  };

  if (!body.vocabularyId || typeof body.success !== "boolean") {
    return NextResponse.json(
      { error: "vocabularyId and success are required" },
      { status: 400 },
    );
  }

  const engine = getLearningEngine();
  const progress = engine.learning.completeReview(
    body.vocabularyId,
    body.success,
    body.queueItemId,
  );
  return NextResponse.json({
    progress,
    dueCount: engine.review.dueCount(),
  });
}
