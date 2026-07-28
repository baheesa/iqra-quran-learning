import { NextResponse } from "next/server";

import { getLearningEngine } from "@/features/learning/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = getLearningEngine();
  return NextResponse.json({
    active: engine.sessions.getActive(),
    sessions: engine.sessions.list(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "start" | "advance" | "tick" | "attachReflection";
    targetMinutes?: number;
    elapsedSeconds?: number;
    reflectionId?: string;
    sessionId?: string;
  };

  const engine = getLearningEngine();

  switch (body.action) {
    case "start":
      return NextResponse.json({
        session: engine.sessions.start({
          targetMinutes: body.targetMinutes,
        }),
      });
    case "advance":
      return NextResponse.json({
        session: engine.sessions.advancePhase(body.sessionId),
      });
    case "tick":
      if (typeof body.elapsedSeconds !== "number") {
        return NextResponse.json(
          { error: "elapsedSeconds required" },
          { status: 400 },
        );
      }
      return NextResponse.json({
        session: engine.sessions.tick(body.elapsedSeconds, body.sessionId),
      });
    case "attachReflection":
      if (!body.reflectionId) {
        return NextResponse.json(
          { error: "reflectionId required" },
          { status: 400 },
        );
      }
      return NextResponse.json({
        session: engine.sessions.attachReflection(
          body.reflectionId,
          body.sessionId,
        ),
      });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
