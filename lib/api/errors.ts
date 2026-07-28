import { NextResponse } from "next/server";

import { logger } from "@/lib/observability/logger";

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
};

/**
 * Safe API error response — never includes stack traces.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  options?: { log?: boolean; cause?: unknown },
): NextResponse<ApiErrorBody> {
  if (options?.log !== false) {
    logger.warn("api_error", {
      code,
      status,
      message,
      cause:
        options?.cause instanceof Error
          ? options.cause.message
          : options?.cause
            ? String(options.cause)
            : undefined,
    });
  }

  return NextResponse.json(
    {
      success: false as const,
      error: { code, message },
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function apiSuccess<T>(
  data: T,
  message = "",
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    init,
  );
}

/** Public-facing message; never echo internal exception details in production. */
export function publicErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (process.env.NODE_ENV === "production") {
    return fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
