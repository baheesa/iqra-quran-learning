import { NextResponse } from "next/server";

import { getPersonalizationEngine } from "@/features/personalization/server";
import type { ExplanationStyle } from "@/features/personalization/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getPersonalizationEngine();
  return NextResponse.json({ profile: engine.profile.buildProfile() });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    preferredExplanationStyle?: ExplanationStyle;
  };

  if (
    body.preferredExplanationStyle &&
    !["brief", "guided", "detailed"].includes(body.preferredExplanationStyle)
  ) {
    return NextResponse.json({ error: "Invalid style" }, { status: 400 });
  }

  const engine = getPersonalizationEngine();
  if (body.preferredExplanationStyle) {
    engine.profile.setExplanationStyle(body.preferredExplanationStyle);
  }

  return NextResponse.json({ profile: engine.profile.buildProfile() });
}
