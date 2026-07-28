/**
 * Development-only auto-approval for the Knowledge Engine.
 * Production always requires manual verification — never enable there.
 */

export const DEV_AUTO_APPROVER = "development-auto";

export const DEV_AUTO_APPROVE_REASON =
  "Automatic approval for local development";

export const DEV_AUTO_APPROVE_BADGE = "Auto Approved (Development)";

/**
 * Returns true only outside production when explicitly enabled or
 * when running in development without an explicit disable (`KNOWLEDGE_AUTO_APPROVE=0`).
 *
 * Safety: `NODE_ENV=production` always returns false (ignores the flag).
 */
export function isKnowledgeAutoApproveEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV === "production") {
    return false;
  }
  const flag = env.KNOWLEDGE_AUTO_APPROVE;
  if (flag === "1") {
    return true;
  }
  if (flag === "0") {
    return false;
  }
  return env.NODE_ENV === "development";
}
