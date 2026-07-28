import { knowledgePaths } from "@/features/knowledge/paths";
import { lookupVerifiedWord } from "@/features/knowledge/services/vocabulary-index";
import {
  lookupWordInSeed,
  type WordKnowledgeHit,
} from "@/features/reading/services/word-knowledge";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { CACHE_PRIVATE_SHORT, withCacheHeaders } from "@/lib/api/cache-headers";

/**
 * Legacy reading word-knowledge endpoint.
 * Prefer GET /api/v1/knowledge/lookup — this maps the verified index into the older hit shape.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const arabic = searchParams.get("arabic")?.trim();
  if (!arabic) {
    return apiError("MISSING_ARABIC", "arabic is required", 400, { log: false });
  }

  const verified = await lookupVerifiedWord(arabic, knowledgePaths.exports);
  if (verified.found) {
    const hit: WordKnowledgeHit = {
      vocabularyId: verified.vocabularyId ?? "",
      arabic: verified.arabic ?? arabic,
      urduMeaning: verified.meaning ?? "",
      root: verified.root,
      lessonId: "",
      lessonTitle: verified.lesson,
      lessonObjectives: [],
      ruleTitle: verified.rule,
      ruleExplanation: verified.explanation,
      ruleExamples: [],
      source: "muallim_approved",
      sourcePage: verified.page,
    };
    return apiSuccess(hit, "", {
      headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT),
    });
  }

  const seed = lookupWordInSeed(arabic);
  return apiSuccess(seed, "", {
    headers: withCacheHeaders(undefined, CACHE_PRIVATE_SHORT),
  });
}
