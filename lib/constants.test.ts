import { describe, expect, it } from "vitest";

import {
  API_VERSION,
  APP_NAME_URDU,
  DAILY_STUDY_MINUTES_DEFAULT,
} from "@/lib/constants";

describe("foundation constants", () => {
  it("keeps the Urdu product name", () => {
    expect(APP_NAME_URDU).toContain("قرآن");
  });

  it("defaults daily study to 20 minutes", () => {
    expect(DAILY_STUDY_MINUTES_DEFAULT).toBe(20);
  });

  it("versions the API as v1", () => {
    expect(API_VERSION).toBe("v1");
  });
});
