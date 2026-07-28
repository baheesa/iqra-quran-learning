import { NextResponse } from "next/server";

import { getTeacherEngine } from "@/features/teacher/server";
import type { TeacherAskInput } from "@/features/teacher/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as TeacherAskInput & { arabic?: string };

  if (!body.reading?.selectedWord && !body.arabic && !body.question) {
    return NextResponse.json(
      { error: "selectedWord or arabic is required" },
      { status: 400 },
    );
  }

  const engine = getTeacherEngine();
  const response = await engine.teacher.explainWord(body);
  return NextResponse.json({ response });
}
