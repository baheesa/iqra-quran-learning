import { mkdir, mkdtemp, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";

import { createAdminEngine } from "@/features/admin/create-engine";
import { roleHasPermission } from "@/features/admin/permissions";
import { createMemoryAdminStore } from "@/features/admin/repository/memory-store";
import { createKnowledgeEngine } from "@/features/knowledge/create-engine";
import { createFileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type { PageExtraction } from "@/features/knowledge/types";

async function seedBook(root: string) {
  const original = path.join(root, "original");
  await mkdir(original, { recursive: true });
  await writeFile(
    path.join(original, "Unit 1.txt"),
    "===== PAGE 1 =====\nرَبِّ\n",
    "utf8",
  );

  const repo = createFileKnowledgeRepository(root);
  const knowledge = createKnowledgeEngine({
    repo,
    useStubPdf: true,
    useStubAi: true,
  });
  const manifest = await knowledge.import.importOne("Unit 1.txt");
  await knowledge.extraction.extractPage(manifest.slug, 1);
  return { knowledge, manifest };
}

describe("admin knowledge management", () => {
  const temps: string[] = [];

  afterEach(async () => {
    // leave temps; OS cleans eventually — avoid destructive rm in sandbox
    temps.length = 0;
  });

  it("enforces role permissions", () => {
    expect(roleHasPermission("ADMIN", "knowledge.publish")).toBe(true);
    expect(roleHasPermission("REVIEWER", "knowledge.publish")).toBe(false);
    expect(roleHasPermission("REVIEWER", "knowledge.approve")).toBe(true);
    expect(roleHasPermission("VIEWER", "knowledge.approve")).toBe(false);
    expect(roleHasPermission("VIEWER", "knowledge.search")).toBe(true);
  });

  it("restricts RoleService.assert by role", async () => {
    const store = createMemoryAdminStore();
    const engine = createAdminEngine({ store, useMemory: true });
    const viewer = await engine.roles.assign({
      authUserId: "u1",
      email: "viewer@test.local",
      role: "VIEWER",
    });
    const actor = {
      authUserId: viewer.authUserId,
      email: viewer.email,
      role: viewer.role,
    };
    expect(() => engine.roles.assert(actor, "knowledge.publish")).toThrow(
      /not allowed/,
    );
    expect(() => engine.roles.assert(actor, "knowledge.search")).not.toThrow();
  });

  it("creates versions and supports rollback", async () => {
    const engine = createAdminEngine({ useMemory: true });
    const actor = {
      authUserId: "admin-1",
      email: "admin@test.local",
      role: "ADMIN" as const,
    };
    const v1 = await engine.versions.create({
      bookSlug: "unit-1",
      objectType: "PAGE",
      objectId: "page-1",
      payload: { text: "first" },
      actor,
    });
    const v2 = await engine.versions.create({
      bookSlug: "unit-1",
      objectType: "PAGE",
      objectId: "page-1",
      payload: { text: "second" },
      actor,
    });
    expect(v2.version).toBe(2);
    const rolled = await engine.versions.rollback({
      bookSlug: "unit-1",
      objectType: "PAGE",
      objectId: "page-1",
      version: v1.version,
      actor,
    });
    expect(rolled.version).toBe(3);
    expect(rolled.payload).toEqual({ text: "first" });
    const audit = await engine.audit.list(10);
    expect(audit.some((item) => item.action === "VERSION_CREATED")).toBe(true);
    expect(audit.some((item) => item.action === "VERSION_ROLLBACK")).toBe(true);
  });

  it("validates and publishes only approved clean knowledge", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "qls-admin-"));
    temps.push(root);
    const { knowledge, manifest } = await seedBook(root);
    const store = createMemoryAdminStore();
    const engine = createAdminEngine({
      store,
      knowledge,
      useMemory: true,
    });
    const actor = {
      authUserId: "admin-1",
      email: "admin@test.local",
      role: "ADMIN" as const,
    };

    const before = await engine.validation.validateBook(manifest.slug);
    expect(before.ok).toBe(false);
    expect(
      before.issues.some((item) => item.code === "MISSING_LESSON"),
    ).toBe(true);

    await engine.admin.approvePage({
      bookSlug: manifest.slug,
      pageNumber: 1,
      actor,
    });

    // Inject duplicate vocabulary to exercise validation
    const extraction = (await knowledge.repo.getExtraction(
      manifest.slug,
      1,
    )) as PageExtraction;
    const baseVocab = {
      id: "vocab-a",
      bookId: manifest.id,
      bookSlug: manifest.slug,
      pageNumber: 1,
      lesson: null,
      sourceImage: null,
      confidence: 0.9,
      verificationStatus: "APPROVED" as const,
      createdAt: new Date().toISOString(),
      version: "1",
      arabic: "كتاب",
      urdu: "کتاب",
      unit: 1,
      page: 1,
      verified: true,
    };
    await knowledge.repo.saveExtraction({
      ...extraction,
      vocabulary: [baseVocab, { ...baseVocab, id: "vocab-b" }],
      verificationStatus: "APPROVED",
    });
    const bad = await engine.validation.validateBook(manifest.slug);
    expect(bad.ok).toBe(false);
    expect(
      bad.issues.some((item) => item.code === "DUPLICATE_VOCABULARY"),
    ).toBe(true);

    await knowledge.repo.saveExtraction({
      ...extraction,
      vocabulary: [baseVocab],
      verificationStatus: "APPROVED",
    });

    const publish = await engine.publication.publish({
      bookSlug: manifest.slug,
      actor,
    });
    expect(publish.ok).toBe(true);
    expect(publish.publication.status).toBe("PUBLISHED");

    const exported = await knowledge.export.get(manifest.slug);
    expect(exported).not.toBeNull();

    const audit = await engine.audit.list(20);
    expect(audit.some((item) => item.action === "KNOWLEDGE_APPROVED")).toBe(
      true,
    );
    expect(audit.some((item) => item.action === "KNOWLEDGE_PUBLISHED")).toBe(
      true,
    );
  });

  it("records role changes in audit log", async () => {
    const engine = createAdminEngine({ useMemory: true });
    const admin = await engine.roles.assign({
      authUserId: "a1",
      email: "admin@test.local",
      role: "ADMIN",
    });
    await engine.audit.record({
      actor: {
        authUserId: admin.authUserId,
        email: admin.email,
        role: admin.role,
      },
      action: "USER_ROLE_CHANGED",
      objectType: "STAFF",
      objectId: admin.id,
      meta: { role: "ADMIN" },
    });
    const entries = await engine.audit.list();
    expect(entries[0]?.action).toBe("USER_ROLE_CHANGED");
    expect(entries[0]?.actorEmail).toBe("admin@test.local");
  });

  it("archives books without deleting originals", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "qls-admin-arc-"));
    temps.push(root);
    const { knowledge, manifest } = await seedBook(root);
    const engine = createAdminEngine({
      knowledge,
      useMemory: true,
    });
    const actor = {
      authUserId: "admin-1",
      email: "admin@test.local",
      role: "ADMIN" as const,
    };
    const archived = await engine.admin.archiveBook(manifest.slug, actor);
    expect(archived.status).toBe("ARCHIVED");
    const stillThere = await knowledge.books.discover();
    expect(stillThere.some((item) => item.fileName === "Unit 1.txt")).toBe(
      true,
    );
  });
});
