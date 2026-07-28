import { getAyahCards } from "@/features/reading/services/search-data";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { CACHE_PRIVATE_SHORT, withCacheHeaders } from "@/lib/api/cache-headers";

/** GET /api/v1/quran/ayah-cards — full ayah Arabic + connected WBW Urdu. */
export async function GET() {
  try {
    const ayahs = await getAyahCards();
    return apiSuccess(
      { ayahs },
      "",
      { headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT) },
    );
  } catch (error) {
    return apiError("AYAH_CARDS_FAILED", "Ayah cards could not load", 500, {
      cause: error,
    });
  }
}
