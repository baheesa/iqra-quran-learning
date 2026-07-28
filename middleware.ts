import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  checkRateLimit,
  clientKeyFromRequest,
} from "@/lib/api/rate-limit";
import { assertAdminOpenLocalSafeForProduction } from "@/lib/security/admin-open-local";

let productionGuardRan = false;

function securityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  return response;
}

export function middleware(request: NextRequest) {
  if (!productionGuardRan && process.env.NODE_ENV === "production") {
    productionGuardRan = true;
    try {
      assertAdminOpenLocalSafeForProduction();
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message:
            error instanceof Error
              ? error.message
              : "ADMIN_OPEN_LOCAL misconfigured",
          service: "quran-learning-app",
          ts: new Date().toISOString(),
        }),
      );
    }
  }

  const pathname = request.nextUrl.pathname;

  // Rate-limit mutating API routes (single-node limiter).
  if (
    pathname.startsWith("/api/v1/") &&
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS"
  ) {
    const limit = Number(process.env.API_RATE_LIMIT ?? "60");
    const windowMs = Number(process.env.API_RATE_WINDOW_MS ?? "60000");
    const key = `${clientKeyFromRequest(request)}:${pathname}`;
    const result = checkRateLimit(key, limit, windowMs);
    if (!result.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again shortly.",
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSec),
          },
        },
      );
      return securityHeaders(response);
    }
  }

  const response = NextResponse.next();
  return securityHeaders(response);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|fonts/).*)",
  ],
};
