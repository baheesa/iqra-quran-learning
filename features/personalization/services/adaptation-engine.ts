import type { LearnerProfileService } from "@/features/personalization/services/learner-profile-service";
import type { AdaptationHints } from "@/features/personalization/types";

/**
 * AdaptationEngine — HOW the AI Teacher should adapt tone/depth.
 * Does not decide curriculum (Learning Engine does).
 */
export function createAdaptationEngine(deps: {
  profile: LearnerProfileService;
}) {
  return {
    buildHints(): AdaptationHints {
      const profile = deps.profile.buildProfile();
      const style = profile.preferredExplanationStyle;

      const emphasizeRecognition =
        profile.averageConfidence < 55 ||
        profile.weakVocabulary.length > 0 ||
        profile.confidenceTrend === "falling";

      const avoidOverwhelm =
        profile.averageSessionMinutes > 0 && profile.averageSessionMinutes < 12;

      const reinforceWords = profile.strongVocabulary
        .slice(0, 3)
        .map((item) => item.arabic);

      const mentionWeakWords = profile.weakVocabulary
        .slice(0, 3)
        .map((item) => item.arabic);

      const depth =
        style === "brief"
          ? "brief"
          : style === "detailed"
            ? "detailed"
            : emphasizeRecognition
              ? "guided"
              : style;

      const trendNote =
        profile.confidenceTrend === "rising"
          ? "اعتماد بڑھ رہا ہے — حوصلہ افزائی کریں۔"
          : profile.confidenceTrend === "falling"
            ? "اعتماد کم ہو رہا ہے — پہلے پہچان اور نظرثانی۔"
            : "اعتماد مستحکم ہے — مختصر رہنمائی کافی ہے۔";

      const guidanceUrdu = [
        `وضاحت کا انداز: ${depth === "brief" ? "مختصر" : depth === "detailed" ? "تفصیلی" : "رہنمائی کے ساتھ"}`,
        emphasizeRecognition
          ? "پہچان کو ترجیح دیں۔"
          : "سادہ وضاحت دے سکتے ہیں۔",
        avoidOverwhelm ? "ایک خیال فی جواب۔" : "",
        trendNote,
        profile.currentLessonTitle
          ? `موجودہ سبق: ${profile.currentLessonTitle}`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        explanationStyle: style,
        explanationDepth: depth,
        emphasizeRecognition,
        reinforceWords,
        mentionWeakWords,
        currentLessonTitle: profile.currentLessonTitle,
        confidenceTrend: profile.confidenceTrend,
        avoidOverwhelm,
        guidanceUrdu,
      };
    },
  };
}

export type AdaptationEngine = ReturnType<typeof createAdaptationEngine>;
