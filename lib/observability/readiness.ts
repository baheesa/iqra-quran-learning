import { access } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export type HealthStatus = "ok" | "degraded" | "fail";

export type ReadinessReport = {
  status: HealthStatus;
  checks: {
    name: string;
    ok: boolean;
    detail?: string;
  }[];
  durationMs: number;
};

async function checkQuranData(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const file = path.join(process.cwd(), "data", "quran", "pages", "1.json");
    await access(file);
    return { ok: true };
  } catch {
    return { ok: false, detail: "Quran page 1 missing under data/quran/pages" };
  }
}

async function checkDatabase(): Promise<{ ok: boolean; detail?: string }> {
  if (!process.env.DATABASE_URL) {
    return { ok: true, detail: "DATABASE_URL unset — skipped" };
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail:
        error instanceof Error ? error.message : "Database unreachable",
    };
  }
}

export async function runReadinessChecks(): Promise<ReadinessReport> {
  const start = Date.now();
  const [quran, database] = await Promise.all([
    checkQuranData(),
    checkDatabase(),
  ]);

  const checks = [
    { name: "quran_data", ok: quran.ok, detail: quran.detail },
    { name: "database", ok: database.ok, detail: database.detail },
  ];

  const criticalFailed = !quran.ok;
  const anyFailed = checks.some((item) => !item.ok);
  const status: HealthStatus = criticalFailed
    ? "fail"
    : anyFailed
      ? "degraded"
      : "ok";

  const report: ReadinessReport = {
    status,
    checks,
    durationMs: Date.now() - start,
  };

  logger.info("readiness_check", {
    status: report.status,
    durationMs: report.durationMs,
  });

  return report;
}
