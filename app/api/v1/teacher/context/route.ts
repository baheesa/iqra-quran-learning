import { NextResponse } from "next/server";

import { getTeacherEngine } from "@/features/teacher/server";
import type { TeacherAskInput } from "@/features/teacher/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as TeacherAskInput;
  const engine = getTeacherEngine();
  const preview = await engine.teacher.previewContext({
    ...body,
    question: body.question || "context preview",
  });
  return NextResponse.json({ preview });
}
