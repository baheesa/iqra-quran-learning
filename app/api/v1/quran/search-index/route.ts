import { getWordSearchIndex } from "@/features/reading/services/search-data";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { CACHE_PRIVATE_SHORT, withCacheHeaders } from "@/lib/api/cache-headers";

/** GET /api/v1/quran/search-index — normalized Arabic form → mushaf hits. */
export async function GET() {
  try {
    const forms = await getWordSearchIndex();
    return apiSuccess(
      { forms },
      "",
      { headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT) },
    );
  } catch (error) {
    return apiError("SEARCH_INDEX_FAILED", "Search index could not load", 500, {
      cause: error,
    });
  }
}
