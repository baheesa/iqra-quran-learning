import type { LearnerState } from "@/features/learning/types";
import type { PersonalizationPreferences } from "@/features/personalization/types";
import type { ConversationRecord } from "@/features/teacher/types";
import type {
  BookmarkRecord,
  ReadingHistoryEntry,
  ReadingPosition,
} from "@/types/quran";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  emailConfirmed: boolean;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: AuthUser;
};

export type AuthResult =
  | { ok: true; session: AuthSession; message?: string }
  | { ok: false; error: string };

export type ReadingSyncSlice = {
  position: ReadingPosition | null;
  history: ReadingHistoryEntry[];
  bookmarks: BookmarkRecord[];
};

export type SyncBundle = {
  schemaVersion: 1;
  updatedAt: string;
  revision: number;
  checksum: string;
  learning: LearnerState;
  reading: ReadingSyncSlice;
  teacherConversations: ConversationRecord[];
  personalization: PersonalizationPreferences;
};

export type CloudStateRecord = {
  authUserId: string;
  learnerId: string;
  revision: number;
  checksum: string;
  payload: SyncBundle;
  updatedAt: string;
  syncedAt: string;
};

export type ConflictStrategy =
  "newer_wins" | "keep_local" | "keep_remote" | "merge";

export type ConflictResolution = {
  strategy: ConflictStrategy;
  bundle: SyncBundle;
  note: string;
};

export type SyncOp =
  | {
      id: string;
      type: "push";
      createdAt: string;
      bundleRevision: number;
    }
  | {
      id: string;
      type: "pull";
      createdAt: string;
    }
  | {
      id: string;
      type: "migrate";
      createdAt: string;
      merge: boolean;
    };

export type SyncStatus = {
  online: boolean;
  authenticated: boolean;
  guest: boolean;
  lastSyncedAt: string | null;
  pendingOps: number;
  revision: number | null;
  conflict: boolean;
};

export type MigrationPreview = {
  hasLocalData: boolean;
  hasCloudData: boolean;
  localUpdatedAt: string | null;
  cloudUpdatedAt: string | null;
  localChecksum: string | null;
  cloudChecksum: string | null;
  requiresUserChoice: boolean;
};
