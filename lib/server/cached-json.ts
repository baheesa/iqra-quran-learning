import { readFile, stat } from "fs/promises";

type CacheEntry<T> = {
  mtimeMs: number;
  value: T;
};

const fileCache = new Map<string, CacheEntry<unknown>>();

/**
 * Read + parse JSON once per mtime. Avoids re-parsing large curriculum /
 * meta files on every request (important on ~1GB hosts).
 */
export async function readCachedJson<T>(absolutePath: string): Promise<T> {
  const info = await stat(absolutePath);
  const hit = fileCache.get(absolutePath);
  if (hit && hit.mtimeMs === info.mtimeMs) {
    return hit.value as T;
  }
  const raw = await readFile(absolutePath, "utf8");
  const value = JSON.parse(raw) as T;
  fileCache.set(absolutePath, { mtimeMs: info.mtimeMs, value });
  return value;
}

/** Test / admin helper — drop one path or the whole cache. */
export function clearCachedJson(absolutePath?: string): void {
  if (absolutePath) {
    fileCache.delete(absolutePath);
    return;
  }
  fileCache.clear();
}

type LruEntry<T> = {
  value: T;
  /** Insertion / last-access order key for eviction. */
  touched: number;
};

/**
 * Small in-process LRU for hot Quran pages (and similar). Caps resident
 * parsed JSON so browsing many pages cannot grow unbounded.
 */
export function createJsonLruCache<T>(maxEntries: number) {
  const map = new Map<string, LruEntry<T>>();
  let clock = 0;

  return {
    get(key: string): T | undefined {
      const entry = map.get(key);
      if (!entry) return undefined;
      entry.touched = ++clock;
      return entry.value;
    },
    set(key: string, value: T): void {
      if (map.has(key)) {
        map.set(key, { value, touched: ++clock });
        return;
      }
      if (map.size >= maxEntries) {
        let oldestKey: string | null = null;
        let oldestTouch = Infinity;
        for (const [k, e] of map) {
          if (e.touched < oldestTouch) {
            oldestTouch = e.touched;
            oldestKey = k;
          }
        }
        if (oldestKey) map.delete(oldestKey);
      }
      map.set(key, { value, touched: ++clock });
    },
    clear(): void {
      map.clear();
    },
    size(): number {
      return map.size;
    },
  };
}
