import path from "path";

import { createFileAdminStore } from "@/features/admin/repository/file-store";
import { createMemoryAdminStore } from "@/features/admin/repository/memory-store";
import type { AdminStore } from "@/features/admin/repository/types";
import {
  createAdminService,
  createSearchService,
} from "@/features/admin/services/admin-service";
import { createAuditLogService } from "@/features/admin/services/audit-log-service";
import { createPublicationService } from "@/features/admin/services/publication-service";
import { createRoleService } from "@/features/admin/services/role-service";
import { createKnowledgeValidationService } from "@/features/admin/services/validation-service";
import { createVersionService } from "@/features/admin/services/version-service";
import {
  createKnowledgeEngine,
  type KnowledgeEngine,
} from "@/features/knowledge/create-engine";

export type AdminEngineDeps = {
  store?: AdminStore;
  knowledge?: KnowledgeEngine;
  useMemory?: boolean;
  rootDir?: string;
};

export function createAdminEngine(deps: AdminEngineDeps = {}) {
  const useMemory =
    deps.useMemory ??
    (process.env.NODE_ENV === "test" ||
      process.env.ADMIN_PROVIDER === "memory");

  const store =
    deps.store ??
    (useMemory
      ? createMemoryAdminStore()
      : createFileAdminStore(
          deps.rootDir ??
            path.join(process.cwd(), "data", "admin"),
        ));

  const knowledge =
    deps.knowledge ??
    createKnowledgeEngine({
      useStubPdf: useMemory,
      useStubAi: true,
    });

  const roles = createRoleService(store);
  const audit = createAuditLogService(store);
  const versions = createVersionService(store, audit);
  const validation = createKnowledgeValidationService(knowledge, store);
  const publication = createPublicationService({
    knowledge,
    store,
    validation,
    audit,
  });
  const search = createSearchService(knowledge);
  const admin = createAdminService({
    knowledge,
    store,
    roles,
    audit,
    versions,
    validation,
    publication,
    search,
  });

  return {
    store,
    knowledge,
    roles,
    audit,
    versions,
    validation,
    publication,
    search,
    admin,
  };
}

export type AdminEngine = ReturnType<typeof createAdminEngine>;
