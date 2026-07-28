import { NextResponse } from "next/server";

import { API_VERSION } from "@/lib/constants";
import { logger } from "@/lib/observability/logger";

/** Liveness — process is up. Does not check dependencies. */
export async function GET() {
  logger.debug("health_liveness");
  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      apiVersion: API_VERSION,
      service: "quran-learning-app",
      milestone: "9-production",
      checks: "liveness",
    },
    message: "OK",
    timestamp: new Date().toISOString(),
  });
}
