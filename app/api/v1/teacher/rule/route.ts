import { NextResponse } from "next/server";

import { getTeacherEngine } from "@/features/teacher/server";
import type { TeacherAskInput } from "@/features/teacher/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as TeacherAskInput & { ruleId?: string };

  if (!body.ruleId) {
    return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
  }

  const engine = getTeacherEngine();
  const response = await engine.teacher.explainRule({
    ...body,
    ruleId: body.ruleId,
  });
  return NextResponse.json({ response });
}
