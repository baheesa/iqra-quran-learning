import { createHash } from "crypto";

import type { SyncBundle } from "@/features/auth/types";

export function computeChecksum(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 32);
}

export function withChecksum(
  bundle: Omit<SyncBundle, "checksum"> & { checksum?: string },
): SyncBundle {
  const without = {
    schemaVersion: bundle.schemaVersion,
    updatedAt: bundle.updatedAt,
    revision: bundle.revision,
    learning: bundle.learning,
    reading: bundle.reading,
    teacherConversations: bundle.teacherConversations,
    personalization: bundle.personalization,
  };
  return {
    ...without,
    checksum: computeChecksum(without),
  };
}

export function bundlesEqual(a: SyncBundle, b: SyncBundle): boolean {
  return a.checksum === b.checksum;
}
