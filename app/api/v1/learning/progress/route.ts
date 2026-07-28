import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  return NextResponse.json({
    progress: engine.lessons.listProgress(),
    vocabulary: engine.vocabulary.listProgress(),
    rules: engine.rules.listProgress(),
    profile: engine.repo.getState().profile,
  });
}
