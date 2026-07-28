import { NextResponse } from "next/server";

import { getBearerToken } from "@/features/auth/http";
import { getAuthSyncEngine } from "@/features/auth/server";
import type { SyncBundle } from "@/features/auth/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  const engine = getAuthSyncEngine();
  const { session } = await engine.sessions.resolve(token);

  if (!session) {
    return NextResponse.json({ error: "سائن ان درکار ہے" }, { status: 401 });
  }

  const body = (await request.json()) as {
    local?: SyncBundle;
    remote?: SyncBundle;
    strategy?: "newer_wins" | "keep_local" | "keep_remote" | "merge";
  };

  if (!body.local || !body.remote) {
    return NextResponse.json(
      { error: "local اور remote دونوں درکار ہیں" },
      { status: 400 },
    );
  }

  const resolution = engine.conflicts.resolve(
    body.local,
    body.remote,
    body.strategy ?? "newer_wins",
  );

  return NextResponse.json({ resolution });
}
