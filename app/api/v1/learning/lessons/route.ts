import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  return NextResponse.json({
    lessons: engine.lessons.listCurriculum(),
    progress: engine.lessons.listProgress(),
    currentLessonId: engine.lessons.getCurrentLessonId(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "setCurrent" | "markReadingComplete" | "recompute";
    lessonId?: string;
  };

  if (!body.lessonId || !body.action) {
    return NextResponse.json(
      { error: "lessonId and action are required" },
      { status: 400 },
    );
  }

  const engine = getLearningEngine();

  if (body.action === "setCurrent") {
    engine.lessons.setCurrentLesson(body.lessonId);
    return NextResponse.json({
      currentLessonId: engine.lessons.getCurrentLessonId(),
    });
  }

  if (body.action === "markReadingComplete") {
    return NextResponse.json({
      progress: engine.lessons.markReadingComplete(body.lessonId),
    });
  }

  return NextResponse.json({
    progress: engine.lessons.recompute(body.lessonId),
  });
}
