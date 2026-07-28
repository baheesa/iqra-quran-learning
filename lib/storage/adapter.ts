/**
 * Storage adapter interface.
 * LocalStorage today; Prisma/Supabase later without UI changes.
 */
export type StorageAdapter = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function createMemoryStorage(
  initial: Record<string, string> = {},
): StorageAdapter {
  const store = new Map<string, string>(Object.entries(initial));

  return {
    getItem(key) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

export function createBrowserLocalStorage(): StorageAdapter {
  if (typeof window === "undefined") {
    return createMemoryStorage();
  }

  return {
    getItem(key) {
      return window.localStorage.getItem(key);
    },
    setItem(key, value) {
      window.localStorage.setItem(key, value);
    },
    removeItem(key) {
      window.localStorage.removeItem(key);
    },
  };
}
