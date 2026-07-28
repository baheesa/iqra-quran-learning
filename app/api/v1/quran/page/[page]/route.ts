import { QURAN_PAGE_COUNT } from "@/features/reading/constants";
import { getQuranPage } from "@/features/reading/services/quran-service";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { CACHE_QURAN_PAGE, withCacheHeaders } from "@/lib/api/cache-headers";
import { logger } from "@/lib/observability/logger";

type RouteContext = {
  params: Promise<{ page: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { page: pageParam } = await context.params;
  const page = Number(pageParam);

  if (!Number.isInteger(page) || page < 1 || page > QURAN_PAGE_COUNT) {
    return apiError(
      "INVALID_PAGE",
      `صفحہ ۱ تا ${QURAN_PAGE_COUNT} کے درمیان ہونا چاہیے`,
      400,
      { log: false },
    );
  }

  const start = Date.now();
  try {
    const data = await getQuranPage(page);
    logger.debug("quran_page_served", {
      page,
      durationMs: Date.now() - start,
    });
    return apiSuccess(data, "", {
      headers: withCacheHeaders(undefined, CACHE_QURAN_PAGE),
    });
  } catch (error) {
    return apiError("PAGE_LOAD_FAILED", "صفحہ لوڈ نہیں ہو سکا", 500, {
      cause: error,
    });
  }
}
