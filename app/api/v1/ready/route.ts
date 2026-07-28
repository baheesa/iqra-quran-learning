import { NextResponse } from "next/server";

import { API_VERSION } from "@/lib/constants";
import { runReadinessChecks } from "@/lib/observability/readiness";

/**
 * Readiness — safe to receive traffic.
 * Returns 503 when critical checks fail (e.g. Quran data missing).
 */
export async function GET() {
  const report = await runReadinessChecks();
  const statusCode =
    report.status === "fail" ? 503 : report.status === "degraded" ? 200 : 200;

  return NextResponse.json(
    {
      success: report.status !== "fail",
      data: {
        status: report.status,
        apiVersion: API_VERSION,
        service: "quran-learning-app",
        checks: report.checks,
        durationMs: report.durationMs,
      },
      message:
        report.status === "ok"
          ? "Ready"
          : report.status === "degraded"
            ? "Ready with degraded dependencies"
            : "Not ready",
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}
