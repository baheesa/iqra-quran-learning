import { NextResponse } from "next/server";

import { getAuthSyncEngine } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  if (!body.email) {
    return NextResponse.json({ error: "ای میل درکار ہے" }, { status: 400 });
  }
  const engine = getAuthSyncEngine();
  const result = await engine.auth.resetPassword(body.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: result.message });
}
