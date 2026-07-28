import { NextResponse } from "next/server";

import { getBearerToken } from "@/features/auth/http";
import { getAuthSyncEngine } from "@/features/auth/server";
import type { ReadingSyncSlice } from "@/features/auth/types";
import { DEFAULT_LEARNER_ID } from "@/features/learning/constants";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  const engine = getAuthSyncEngine();
  const { session } = await engine.sessions.resolve(token);

  if (!session) {
    return NextResponse.json({ error: "سائن ان درکار ہے" }, { status: 401 });
  }

  const body = (await request.json()) as {
    reading?: ReadingSyncSlice;
    merge?: boolean;
    confirm?: boolean;
    strategy?: "newer_wins" | "keep_local" | "keep_remote" | "merge";
  };

  const local = engine.bundles.buildLocal(body.reading);
  const preview = engine.migration.preview({
    authUserId: session.user.id,
    local,
  });

  if (preview.requiresUserChoice && !body.confirm) {
    return NextResponse.json({
      preview,
      requiresConfirmation: true,
      message:
        "مقامی اور کلاؤڈ دونوں پر پیش رفت موجود ہے۔ ضم کرنے سے پہلے تصدیق کریں۔",
    });
  }

  const applied = engine.migration.apply({
    authUserId: session.user.id,
    learnerId: DEFAULT_LEARNER_ID,
    local,
    merge: body.merge !== false,
    strategy: body.strategy ?? "merge",
  });

  engine.bundles.applyBundle(applied.bundle);

  return NextResponse.json({
    preview,
    note: applied.note,
    revision: applied.bundle.revision,
  });
}
