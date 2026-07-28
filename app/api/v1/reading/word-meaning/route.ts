import { composeWordMeaning } from "@/features/reading/lib/meanings";
import { lookupCanonicalFormMeaning } from "@/features/reading/services/form-meaning";
import { lookupWbwUrduByWordId } from "@/features/reading/services/wbw-urdu";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { CACHE_PRIVATE_SHORT, withCacheHeaders } from "@/lib/api/cache-headers";

/**
 * GET /api/v1/reading/word-meaning?id=1:1:1&word=…
 * Optional prevId/prevWord/nextId/nextWord for composed tips (فی / possessives).
 * Optional standalone=1 — ignore first-hit context; use form consensus (qawaid).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wordId = searchParams.get("id")?.trim() ?? "";
  const arabic =
    searchParams.get("word")?.trim() ||
    searchParams.get("arabic")?.trim() ||
    "";
  const prevId = searchParams.get("prevId")?.trim() || "";
  const prevWord = searchParams.get("prevWord")?.trim() || "";
  const nextId = searchParams.get("nextId")?.trim() || "";
  const nextWord = searchParams.get("nextWord")?.trim() || "";
  const standalone =
    searchParams.get("standalone") === "1" ||
    searchParams.get("standalone") === "true";

  if (!wordId && !arabic) {
    return apiError("MISSING_WORD", "id or word is required", 400, {
      log: false,
    });
  }

  if (standalone && arabic) {
    const meaning = await lookupCanonicalFormMeaning(arabic);
    if (meaning) {
      return apiSuccess(
        {
          found: true,
          wordId: wordId || null,
          arabic,
          meaning,
          source: "quran_wbw_form_consensus",
          message: null,
        },
        "",
        { headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT) },
      );
    }
  }

  if (wordId) {
    const [raw, prevUr, nextUr] = await Promise.all([
      lookupWbwUrduByWordId(wordId),
      prevId ? lookupWbwUrduByWordId(prevId) : Promise.resolve(null),
      nextId ? lookupWbwUrduByWordId(nextId) : Promise.resolve(null),
    ]);

    if (raw) {
      const meaning =
        composeWordMeaning(
          arabic || wordId,
          raw,
          prevWord || null,
          prevUr,
          nextWord || null,
          nextUr,
        ) ?? raw;

      return apiSuccess(
        {
          found: true,
          wordId,
          arabic: arabic || null,
          meaning,
          source: "quran_wbw_urdu",
          message: null,
        },
        "",
        { headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT) },
      );
    }
  }

  if (arabic) {
    const meaning = await lookupCanonicalFormMeaning(arabic);
    if (meaning) {
      return apiSuccess(
        {
          found: true,
          wordId: wordId || null,
          arabic,
          meaning,
          source: "quran_wbw_form_consensus",
          message: null,
        },
        "",
        { headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT) },
      );
    }
  }

  return apiSuccess(
    {
      found: false,
      wordId: wordId || null,
      arabic: arabic || null,
      meaning: null,
      source: null,
      message: "اس لفظ کی وضاحت ابھی دستیاب نہیں۔",
    },
    "",
    { headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT) },
  );
}
