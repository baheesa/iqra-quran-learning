import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  return NextResponse.json({
    rules: engine.rules.listCurriculum(),
    progress: engine.rules.listProgress(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ruleId?: string;
    success?: boolean;
    note?: string;
  };

  if (!body.ruleId || typeof body.success !== "boolean") {
    return NextResponse.json(
      { error: "ruleId and success are required" },
      { status: 400 },
    );
  }

  const engine = getLearningEngine();
  const progress = engine.learning.understandRule(
    body.ruleId,
    body.success,
    body.note,
  );
  return NextResponse.json({ progress });
}
