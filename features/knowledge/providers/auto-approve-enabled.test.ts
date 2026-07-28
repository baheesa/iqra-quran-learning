import { afterEach, describe, expect, it } from "vitest";

import { isKnowledgeAutoApproveEnabled } from "@/features/knowledge/providers/auto-approve-enabled";

describe("isKnowledgeAutoApproveEnabled", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    KNOWLEDGE_AUTO_APPROVE: process.env.KNOWLEDGE_AUTO_APPROVE,
  };

  afterEach(() => {
    // @ts-expect-error test override
    process.env.NODE_ENV = previous.NODE_ENV;
    if (previous.KNOWLEDGE_AUTO_APPROVE === undefined) {
      delete process.env.KNOWLEDGE_AUTO_APPROVE;
    } else {
      process.env.KNOWLEDGE_AUTO_APPROVE = previous.KNOWLEDGE_AUTO_APPROVE;
    }
  });

  it("never enables in production even when flag is 1", () => {
    expect(
      isKnowledgeAutoApproveEnabled({
        NODE_ENV: "production",
        KNOWLEDGE_AUTO_APPROVE: "1",
      }),
    ).toBe(false);
  });

  it("enables when KNOWLEDGE_AUTO_APPROVE=1 outside production", () => {
    expect(
      isKnowledgeAutoApproveEnabled({
        NODE_ENV: "test",
        KNOWLEDGE_AUTO_APPROVE: "1",
      }),
    ).toBe(true);
  });

  it("enables in development when flag is unset", () => {
    expect(
      isKnowledgeAutoApproveEnabled({
        NODE_ENV: "development",
      }),
    ).toBe(true);
  });

  it("disables when KNOWLEDGE_AUTO_APPROVE=0 even in development", () => {
    expect(
      isKnowledgeAutoApproveEnabled({
        NODE_ENV: "development",
        KNOWLEDGE_AUTO_APPROVE: "0",
      }),
    ).toBe(false);
  });

  it("stays off in test without the flag", () => {
    expect(
      isKnowledgeAutoApproveEnabled({
        NODE_ENV: "test",
      }),
    ).toBe(false);
  });
});
