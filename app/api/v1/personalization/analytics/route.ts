import { NextResponse } from "next/server";

import { getPersonalizationEngine } from "@/features/personalization/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getPersonalizationEngine();
  const profile = engine.profile.buildProfile();
  const insights = engine.insights.getInsights();
  const recommendations = engine.recommendations.getRecommendations();
  const plan = engine.studyPlan.buildPlan();
  const adaptation = engine.adaptation.buildHints();

  return NextResponse.json({
    analytics: {
      profile,
      insights,
      recommendations,
      plan,
      adaptation,
    },
  });
}
