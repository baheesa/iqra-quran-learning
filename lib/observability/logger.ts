/**
 * Structured application logging.
 * Never log secrets, tokens, or learner PII beyond ids already in context.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean | null | undefined>;

function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    service: "quran-learning-app",
    ts: new Date().toISOString(),
    ...(context ?? {}),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else if (level === "debug" && process.env.NODE_ENV !== "production") {
    console.debug(line);
  } else if (level === "info" || level === "debug") {
    console.info(line);
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    emit("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
  /** Time an async operation and log duration. */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      emit("info", label, { ...context, durationMs: Date.now() - start, ok: true });
      return result;
    } catch (error) {
      emit("error", label, {
        ...context,
        durationMs: Date.now() - start,
        ok: false,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  },
};
