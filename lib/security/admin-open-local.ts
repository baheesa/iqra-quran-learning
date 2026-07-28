/**
 * ADMIN_OPEN_LOCAL policy.
 *
 * Production: always disabled.
 * Non-production: only enabled when explicitly set to "1" or "true".
 * Default is OFF — maintainers must opt in.
 */
export function isAdminOpenLocalEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return (
    process.env.ADMIN_OPEN_LOCAL === "1" ||
    process.env.ADMIN_OPEN_LOCAL === "true"
  );
}

export function assertAdminOpenLocalSafeForProduction(): void {
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.ADMIN_OPEN_LOCAL === "1" ||
      process.env.ADMIN_OPEN_LOCAL === "true")
  ) {
    throw new Error(
      "ADMIN_OPEN_LOCAL must not be enabled in production. Remove it from the environment.",
    );
  }
}
