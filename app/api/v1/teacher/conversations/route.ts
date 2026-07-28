import { NextResponse } from "next/server";

import { getTeacherEngine } from "@/features/teacher/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const engine = getTeacherEngine();

  if (id) {
    const conversation = engine.conversations.get(id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ conversation });
  }

  return NextResponse.json({
    conversations: engine.conversations.list(),
  });
}
