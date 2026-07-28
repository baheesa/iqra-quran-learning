import { NextResponse } from "next/server";

import { getPersonalizationEngine } from "@/features/personalization/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getPersonalizationEngine();
  return NextResponse.json({
    recommendations: engine.recommendations.getRecommendations(),
  });
}
