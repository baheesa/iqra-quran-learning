import { NextResponse } from "next/server";

import { getTeacherEngine } from "@/features/teacher/server";
import type { TeacherAskInput } from "@/features/teacher/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as TeacherAskInput & {
    lessonId?: string;
  };

  if (!body.lessonId) {
    return NextResponse.json(
      { error: "lessonId is required" },
      { status: 400 },
    );
  }

  const engine = getTeacherEngine();
  const response = await engine.teacher.explainLesson({
    ...body,
    lessonId: body.lessonId,
  });
  return NextResponse.json({ response });
}
