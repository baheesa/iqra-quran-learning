import {
  createLearningEngine,
  type LearningEngine,
} from "@/features/learning/create-engine";
import {
  createFilePrefsStore,
  createMemoryPrefsStore,
  type PersonalizationPrefsStore,
} from "@/features/personalization/repository/prefs-store";
import { createAdaptationEngine } from "@/features/personalization/services/adaptation-engine";
import { createInsightService } from "@/features/personalization/services/insight-service";
import { createLearnerProfileService } from "@/features/personalization/services/learner-profile-service";
import { createRecommendationService } from "@/features/personalization/services/recommendation-service";
import { createStrengthAnalyzer } from "@/features/personalization/services/strength-analyzer";
import { createStudyPlanner } from "@/features/personalization/services/study-planner";
import { createWeaknessAnalyzer } from "@/features/personalization/services/weakness-analyzer";

export function createPersonalizationEngine(deps?: {
  learning?: LearningEngine;
  prefs?: PersonalizationPrefsStore;
  useMemory?: boolean;
}) {
  const learning =
    deps?.learning ??
    createLearningEngine({ useMemory: deps?.useMemory ?? false });

  const prefs =
    deps?.prefs ??
    (deps?.useMemory ? createMemoryPrefsStore() : createFilePrefsStore());

  const weakness = createWeaknessAnalyzer(learning);
  const strength = createStrengthAnalyzer(learning);
  const profile = createLearnerProfileService({
    learning,
    prefs,
    weakness,
    strength,
  });
  const insights = createInsightService({
    learning,
    profile,
    weakness,
    strength,
  });
  const recommendations = createRecommendationService({ profile });
  const studyPlan = createStudyPlanner({ profile, recommendations });
  const adaptation = createAdaptationEngine({ profile });

  return {
    learning,
    prefs,
    weakness,
    strength,
    profile,
    insights,
    recommendations,
    studyPlan,
    adaptation,
  };
}

export type PersonalizationEngine = ReturnType<
  typeof createPersonalizationEngine
>;
