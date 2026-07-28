import { describe, expect, it } from "vitest";

import { createMemoryStorage } from "@/lib/storage/adapter";
import { createTappedWordsService } from "@/features/reading/services/tapped-words-service";

describe("tapped words service", () => {
  it("records taps and updates meaning without inventing glosses", () => {
    const service = createTappedWordsService(createMemoryStorage());
    service.record({ arabic: "رَبِّ", meaning: null, page: 1 });
    service.record({ arabic: "رَبِّ", meaning: "رب", page: 1 });

    const list = service.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.tapCount).toBe(2);
    expect(list[0]?.meaning).toBe("رب");
  });
});
