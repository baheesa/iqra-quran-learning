"use client";

import type { AuthSession } from "@/features/auth/types";
import type { ReadingSyncSlice } from "@/features/auth/types";
import { STORAGE_KEYS } from "@/features/reading/constants";
import type {
  BookmarkRecord,
  ReadingHistoryEntry,
  ReadingPosition,
} from "@/types/quran";

const SESSION_KEY = "qls.auth.session";

export function saveClientSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadClientSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function authHeaders(): HeadersInit {
  const session = loadClientSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.accessToken}` };
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function collectReadingSlice(): ReadingSyncSlice {
  if (typeof window === "undefined") {
    return { position: null, history: [], bookmarks: [] };
  }
  return {
    position: parseJson<ReadingPosition | null>(
      window.localStorage.getItem(STORAGE_KEYS.readingPosition),
      null,
    ),
    history: parseJson<ReadingHistoryEntry[]>(
      window.localStorage.getItem(STORAGE_KEYS.readingHistory),
      [],
    ),
    bookmarks: parseJson<BookmarkRecord[]>(
      window.localStorage.getItem(STORAGE_KEYS.bookmarks),
      [],
    ),
  };
}

export function applyReadingSlice(reading: ReadingSyncSlice): void {
  if (typeof window === "undefined") return;
  if (reading.position) {
    window.localStorage.setItem(
      STORAGE_KEYS.readingPosition,
      JSON.stringify(reading.position),
    );
  }
  window.localStorage.setItem(
    STORAGE_KEYS.readingHistory,
    JSON.stringify(reading.history),
  );
  window.localStorage.setItem(
    STORAGE_KEYS.bookmarks,
    JSON.stringify(reading.bookmarks),
  );
}
