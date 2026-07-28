import { NextResponse } from "next/server";

import { getTeacherEngine } from "@/features/teacher/server";
import type { TeacherAskInput } from "@/features/teacher/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as TeacherAskInput;

  if (!body.question?.trim() && !body.reading?.selectedWord) {
    return NextResponse.json(
      { error: "question or selectedWord is required" },
      { status: 400 },
    );
  }

  const engine = getTeacherEngine();
  const response = await engine.teacher.ask(body);
  return NextResponse.json({ response });
}
