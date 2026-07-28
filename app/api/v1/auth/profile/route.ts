import { NextResponse } from "next/server";

import { getBearerToken } from "@/features/auth/http";
import { getAuthSyncEngine } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  const engine = getAuthSyncEngine();
  const { guest, session } = await engine.sessions.resolve(token);

  if (guest || !session) {
    return NextResponse.json({
      guest: true,
      user: null,
    });
  }

  return NextResponse.json({
    guest: false,
    user: session.user,
  });
}
