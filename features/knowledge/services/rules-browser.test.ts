import { describe, expect, it } from "vitest";

import {
  groupRulesByUnit,
  sortRulesChronologically,
  type LearnerRule,
} from "@/features/knowledge/services/rules-browser";

describe("rules browser", () => {
  it("sorts by unit then order — no page metadata required", () => {
    const rules: LearnerRule[] = [
      {
        id: "b",
        title: "فِي",
        definition: "فِي کا مطلب «میں» ہے۔",
        example: "فِي الْأَرْضِ",
        examples: [
          { arabic: "فِي الْأَرْضِ", meaning: "زمین میں" },
          { arabic: "فِي الدِّينِ", meaning: "دین میں" },
        ],
        unit: 2,
        order: 1,
      },
      {
        id: "a",
        title: "وَ",
        definition: "وَ کا مطلب «اور» ہے۔",
        example: "وَالصُّلْحُ خَيْرٌ",
        examples: [{ arabic: "وَالصُّلْحُ خَيْرٌ", meaning: "اور صلح بہتر ہے" }],
        unit: 1,
        order: 1,
      },
    ];
    const sorted = sortRulesChronologically(rules);
    expect(sorted.map((item) => item.id)).toEqual(["a", "b"]);
    expect(groupRulesByUnit(sorted).map((item) => item.unit)).toEqual([1, 2]);
  });
});
