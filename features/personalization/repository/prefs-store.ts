import fs from "fs";
import path from "path";

import type {
  ExplanationStyle,
  PersonalizationPreferences,
} from "@/features/personalization/types";

const DEFAULT_DIR = "data/personalization";

export function defaultPreferences(): PersonalizationPreferences {
  return {
    preferredExplanationStyle: "guided",
    updatedAt: new Date().toISOString(),
  };
}

export type PersonalizationPrefsStore = {
  get(): PersonalizationPreferences;
  set(style: ExplanationStyle): PersonalizationPreferences;
};

export function createMemoryPrefsStore(
  initial?: PersonalizationPreferences,
): PersonalizationPrefsStore {
  let prefs = initial ?? defaultPreferences();
  return {
    get() {
      return { ...prefs };
    },
    set(style) {
      prefs = {
        preferredExplanationStyle: style,
        updatedAt: new Date().toISOString(),
      };
      return { ...prefs };
    },
  };
}

export function createFilePrefsStore(options?: {
  rootDir?: string;
  learnerId?: string;
}): PersonalizationPrefsStore {
  const learnerId = options?.learnerId ?? "local-learner";
  const filePath = path.join(
    options?.rootDir ?? process.cwd(),
    DEFAULT_DIR,
    `${learnerId}.json`,
  );

  function read(): PersonalizationPreferences {
    try {
      if (!fs.existsSync(filePath)) {
        return defaultPreferences();
      }
      return JSON.parse(
        fs.readFileSync(filePath, "utf8"),
      ) as PersonalizationPreferences;
    } catch {
      return defaultPreferences();
    }
  }

  function write(prefs: PersonalizationPreferences): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(prefs, null, 2), "utf8");
  }

  return {
    get() {
      return read();
    },
    set(style) {
      const prefs: PersonalizationPreferences = {
        preferredExplanationStyle: style,
        updatedAt: new Date().toISOString(),
      };
      write(prefs);
      return prefs;
    },
  };
}
