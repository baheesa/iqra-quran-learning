import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  return NextResponse.json({ reflections: engine.reflections.list() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    understoodToday?: string;
    difficultWords?: string[];
    reviewTomorrow?: string;
    lessonId?: string;
    sessionId?: string;
    content?: string;
  };

  const engine = getLearningEngine();
  const reflection = engine.reflections.create(body);

  if (body.sessionId || engine.sessions.getActive()) {
    try {
      engine.sessions.attachReflection(reflection.id, body.sessionId);
    } catch {
      // session may already be finished
    }
  }

  return NextResponse.json({ reflection });
}
