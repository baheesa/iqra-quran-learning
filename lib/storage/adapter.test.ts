import { describe, expect, it } from "vitest";

import { createMemoryStorage } from "@/lib/storage/adapter";

describe("storage adapter", () => {
  it("stores and removes values in memory", () => {
    const storage = createMemoryStorage();
    storage.setItem("a", "1");
    expect(storage.getItem("a")).toBe("1");
    storage.removeItem("a");
    expect(storage.getItem("a")).toBeNull();
  });
});
