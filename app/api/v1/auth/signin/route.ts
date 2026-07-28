import { NextResponse } from "next/server";

import { getAuthSyncEngine } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "ای میل اور پاس ورڈ درکار ہیں" },
      { status: 400 },
    );
  }

  const engine = getAuthSyncEngine();
  const result = await engine.auth.signIn({
    email: body.email,
    password: body.password,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    session: result.session,
    migrationHint: true,
  });
}
