/**
 * Cache-Control helpers for API routes.
 * Quran text is immutable per page; learner data stays private/no-store.
 */

export const CACHE_QURAN_PAGE =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export const CACHE_META =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export const CACHE_PRIVATE_SHORT = "private, max-age=60";

export const CACHE_NO_STORE = "private, no-store";

export function withCacheHeaders(
  headers: HeadersInit | undefined,
  cacheControl: string,
): HeadersInit {
  return {
    ...(headers ?? {}),
    "Cache-Control": cacheControl,
  };
}
