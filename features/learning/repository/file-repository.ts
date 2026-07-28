import fs from "fs";
import path from "path";

import { LEARNING_STORAGE_DIR } from "@/features/learning/constants";
import {
  createEmptyLearnerState,
  type LearningRepository,
} from "@/features/learning/repository/memory-repository";
import type { LearnerState } from "@/features/learning/types";

function resolveStatePath(rootDir?: string): string {
  const root = rootDir ?? process.cwd();
  return path.join(root, LEARNING_STORAGE_DIR, "local-learner.json");
}

export function createFileLearningRepository(options?: {
  rootDir?: string;
}): LearningRepository {
  const filePath = resolveStatePath(options?.rootDir);

  function ensureDir(): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  function read(): LearnerState {
    ensureDir();
    if (!fs.existsSync(filePath)) {
      const empty = createEmptyLearnerState();
      fs.writeFileSync(filePath, JSON.stringify(empty, null, 2), "utf8");
      return empty;
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8")) as LearnerState;
    } catch {
      return createEmptyLearnerState();
    }
  }

  function write(state: LearnerState): void {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
  }

  return {
    getState() {
      return structuredClone(read());
    },
    saveState(state) {
      write(structuredClone(state));
    },
    reset() {
      write(createEmptyLearnerState());
    },
  };
}
