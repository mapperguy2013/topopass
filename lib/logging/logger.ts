export type LogLevel = "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|cookie|authorization|header|service.?role|anon.?key|private.?key|body|raw|json|answer/i;
const SENSITIVE_OBJECT_KEY_PATTERN = /^(user|profile|session)$/i;
const MAX_STRING_LENGTH = 240;

function truncate(value: string) {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...`
    : value;
}

function sanitizeError(error: Error) {
  return {
    name: error.name,
    message: truncate(error.message)
  };
}

export function sanitizeLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return sanitizeError(value);
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return truncate(value);
  }

  if (Array.isArray(value)) {
    return {
      itemCount: value.length
    };
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key) ||
        SENSITIVE_OBJECT_KEY_PATTERN.test(key)
        ? "[redacted]"
        : sanitizeLogValue(entry);
    }

    return result;
  }

  return String(value);
}

export function sanitizeLogContext(context: LogContext = {}) {
  return sanitizeLogValue(context) as LogContext;
}

export function safeUserErrorMessage(
  _error: unknown,
  fallback = "Something went wrong. Please try again."
) {
  return fallback;
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  const sanitized = sanitizeLogContext(context);
  const payload = {
    level,
    message,
    ...sanitized
  };

  if (process.env.NODE_ENV === "production") {
    console[level](JSON.stringify(payload));
    return;
  }

  console[level](`[${level}] ${message}`, sanitized);
}

export const logger = {
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  }
};
