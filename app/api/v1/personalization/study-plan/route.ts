import { NextResponse } from "next/server";

import { getPersonalizationEngine } from "@/features/personalization/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minutes = searchParams.get("minutes");
  const engine = getPersonalizationEngine();
  return NextResponse.json({
    plan: engine.studyPlan.buildPlan({
      targetMinutes: minutes ? Number(minutes) : undefined,
    }),
  });
}
