import { describe, expect, it } from "vitest";

import {
  clearCachedJson,
  createJsonLruCache,
  readCachedJson,
} from "@/lib/server/cached-json";
import path from "path";

describe("cached-json", () => {
  it("reuses parsed JSON for the same file", async () => {
    const file = path.join(
      process.cwd(),
      "data",
      "quran",
      "meta.json",
    );
    clearCachedJson(file);
    const a = await readCachedJson<{ pageCount?: number }>(file);
    const b = await readCachedJson<{ pageCount?: number }>(file);
    expect(a).toBe(b);
    expect(a.pageCount ?? 604).toBeGreaterThan(0);
  });

  it("evicts oldest entries from the LRU", () => {
    const cache = createJsonLruCache<number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1); // touch a
    cache.set("c", 3); // should evict b (least recently touched)
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.size()).toBe(2);
  });
});
