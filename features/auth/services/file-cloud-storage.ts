import fs from "fs";
import path from "path";

import type { CloudStorageAdapter } from "@/features/auth/services/cloud-storage-adapter";
import type { CloudStateRecord } from "@/features/auth/types";

export function createFileCloudStorage(options?: {
  rootDir?: string;
}): CloudStorageAdapter {
  const dir = path.join(
    options?.rootDir ?? process.cwd(),
    "data",
    "sync",
    "cloud",
  );

  function fileFor(authUserId: string): string {
    const safe = authUserId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(dir, `${safe}.json`);
  }

  return {
    getByAuthUserId(authUserId) {
      try {
        const file = fileFor(authUserId);
        if (!fs.existsSync(file)) return null;
        return JSON.parse(fs.readFileSync(file, "utf8")) as CloudStateRecord;
      } catch {
        return null;
      }
    },

    put({ authUserId, learnerId, bundle }) {
      fs.mkdirSync(dir, { recursive: true });
      const existing = this.getByAuthUserId(authUserId);
      const now = new Date().toISOString();
      const record: CloudStateRecord = {
        authUserId,
        learnerId: existing?.learnerId ?? learnerId,
        revision: bundle.revision,
        checksum: bundle.checksum,
        payload: bundle,
        updatedAt: now,
        syncedAt: now,
      };
      fs.writeFileSync(
        fileFor(authUserId),
        JSON.stringify(record, null, 2),
        "utf8",
      );
      return structuredClone(record);
    },

    delete(authUserId) {
      const file = fileFor(authUserId);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    },
  };
}
