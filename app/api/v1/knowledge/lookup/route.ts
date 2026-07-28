import { apiError, apiSuccess } from "@/lib/api/errors";
import { CACHE_PRIVATE_SHORT, withCacheHeaders } from "@/lib/api/cache-headers";
import {
  lookupVerifiedWord,
  toLookupApiPayload,
} from "@/features/knowledge/services/vocabulary-index";

/**
 * GET /api/v1/knowledge/lookup?word=يرجون
 * Verified Muallim vocabulary only — never invents meanings.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word =
    searchParams.get("word")?.trim() ||
    searchParams.get("arabic")?.trim() ||
    "";

  if (!word) {
    return apiError("MISSING_WORD", "word is required", 400, { log: false });
  }

  const result = await lookupVerifiedWord(word);
  return apiSuccess(toLookupApiPayload(result), "", {
    headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT),
  });
}
