import { withChecksum } from "@/features/auth/domain/checksum";
import type { CloudStorageAdapter } from "@/features/auth/services/cloud-storage-adapter";
import type { ConflictResolver } from "@/features/auth/services/conflict-resolver";
import type {
  ConflictStrategy,
  MigrationPreview,
  SyncBundle,
} from "@/features/auth/types";

export function createMigrationService(deps: {
  cloud: CloudStorageAdapter;
  conflicts: ConflictResolver;
}) {
  return {
    preview(input: {
      authUserId: string;
      local: SyncBundle | null;
    }): MigrationPreview {
      const cloud = deps.cloud.getByAuthUserId(input.authUserId);
      const hasLocalData = Boolean(
        input.local &&
        (input.local.learning.vocabularyProgress.length > 0 ||
          input.local.reading.bookmarks.length > 0 ||
          input.local.learning.sessions.length > 0 ||
          input.local.teacherConversations.length > 0),
      );
      const hasCloudData = Boolean(cloud);

      return {
        hasLocalData,
        hasCloudData,
        localUpdatedAt: input.local?.updatedAt ?? null,
        cloudUpdatedAt: cloud?.updatedAt ?? null,
        localChecksum: input.local?.checksum ?? null,
        cloudChecksum: cloud?.checksum ?? null,
        requiresUserChoice: hasLocalData && hasCloudData,
      };
    },

    /**
     * Apply migration after user confirmation when both sides have data.
     */
    apply(input: {
      authUserId: string;
      learnerId: string;
      local: SyncBundle;
      merge: boolean;
      strategy?: ConflictStrategy;
    }): { bundle: SyncBundle; note: string } {
      const cloud = deps.cloud.getByAuthUserId(input.authUserId);

      if (!cloud) {
        const bundle = withChecksum({
          ...input.local,
          revision: Math.max(1, input.local.revision),
          updatedAt: new Date().toISOString(),
        });
        deps.cloud.put({
          authUserId: input.authUserId,
          learnerId: input.learnerId,
          bundle,
        });
        return { bundle, note: "مقامی پیش رفت کلاؤڈ پر محفوظ ہو گئی" };
      }

      if (!input.merge) {
        // Keep cloud, discard local upload
        return {
          bundle: cloud.payload,
          note: "کلاؤڈ پیش رفت رکھی گئی؛ مقامی ڈیٹا اپ لوڈ نہیں ہوا",
        };
      }

      const resolution = deps.conflicts.resolve(
        input.local,
        cloud.payload,
        input.strategy ?? "merge",
      );
      deps.cloud.put({
        authUserId: input.authUserId,
        learnerId: input.learnerId,
        bundle: resolution.bundle,
      });
      return { bundle: resolution.bundle, note: resolution.note };
    },
  };
}

export type MigrationService = ReturnType<typeof createMigrationService>;
