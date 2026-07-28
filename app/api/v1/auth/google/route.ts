import { NextResponse } from "next/server";

import { getAuthSyncEngine } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const redirectTo =
    new URL(request.url).searchParams.get("redirectTo") ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`;

  const engine = getAuthSyncEngine();
  const result = await engine.auth.getGoogleSignInUrl(redirectTo);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url });
}
