import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  return NextResponse.json({
    vocabulary: engine.vocabulary.listCurriculum(),
    progress: engine.vocabulary.listProgress(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    vocabularyId?: string;
    event?: "seen" | "recognized" | "forgot" | "review_success" | "review_fail";
  };

  if (!body.vocabularyId || !body.event) {
    return NextResponse.json(
      { error: "vocabularyId and event are required" },
      { status: 400 },
    );
  }

  const engine = getLearningEngine();
  let progress;

  switch (body.event) {
    case "seen":
      progress = engine.learning.seeWord(body.vocabularyId);
      break;
    case "recognized":
      progress = engine.learning.recognizeWord(body.vocabularyId);
      break;
    case "forgot":
      progress = engine.learning.forgotWord(body.vocabularyId);
      break;
    case "review_success":
      progress = engine.learning.completeReview(body.vocabularyId, true);
      break;
    case "review_fail":
      progress = engine.learning.completeReview(body.vocabularyId, false);
      break;
    default:
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ progress });
}
