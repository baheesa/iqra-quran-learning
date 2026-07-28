import {
  getJuzIndex,
  getQuranMeta,
  getSurahs,
} from "@/features/reading/services/quran-service";
import { apiSuccess } from "@/lib/api/errors";
import { CACHE_META, withCacheHeaders } from "@/lib/api/cache-headers";

export async function GET() {
  const [meta, surahs, juzIndex] = await Promise.all([
    getQuranMeta(),
    getSurahs(),
    getJuzIndex(),
  ]);

  return apiSuccess(
    { meta, surahs, juzIndex },
    "",
    { headers: withCacheHeaders(undefined, CACHE_META) },
  );
}
