import { NextResponse } from "next/server";

import { getBearerToken } from "@/features/auth/http";
import { getAuthSyncEngine } from "@/features/auth/server";
import type { ReadingSyncSlice } from "@/features/auth/types";
import { DEFAULT_LEARNER_ID } from "@/features/learning/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  const engine = getAuthSyncEngine();
  const { session } = await engine.sessions.resolve(token);
  const online = request.headers.get("x-online") !== "0";

  const status = engine.sync.getStatus({
    authUserId: session?.user.id ?? null,
    online,
    localRevision: null,
  });

  return NextResponse.json({ status });
}

export async function POST(request: Request) {
  const token = getBearerToken(request);
  const engine = getAuthSyncEngine();
  const { session } = await engine.sessions.resolve(token);

  if (!session) {
    return NextResponse.json(
      { error: "ہم آہنگی کے لیے سائن ان درکار ہے" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    reading?: ReadingSyncSlice;
    online?: boolean;
    strategy?: "newer_wins" | "keep_local" | "keep_remote" | "merge";
  };

  const local = engine.bundles.buildLocal(body.reading);
  const result = engine.sync.sync({
    authUserId: session.user.id,
    learnerId: DEFAULT_LEARNER_ID,
    local,
    online: body.online !== false,
    strategy: body.strategy,
  });

  engine.bundles.applyBundle(result.bundle);

  return NextResponse.json({
    note: result.note,
    status: result.status,
    revision: result.bundle.revision,
    checksum: result.bundle.checksum,
  });
}
