import assert from "node:assert/strict";
import { test } from "node:test";
import {
  logger,
  safeUserErrorMessage,
  sanitizeLogContext
} from "./logger.ts";

test("logger sanitizes sensitive fields", () => {
  const sanitized = sanitizeLogContext({
    feature: "auth",
    password: "top-secret",
    token: "token-value",
    cookie: "session=value",
    importedJsonBody: "{\"question_bank_items\":[]}",
    learnerAnswer: "A40 then Euston Road",
    user: {
      id: "user-id",
      email: "learner@example.com"
    },
    session: {
      access_token: "token"
    },
    nested: {
      authorization: "Bearer secret",
      statusCode: 403
    }
  });

  assert.equal(sanitized.feature, "auth");
  assert.equal(sanitized.password, "[redacted]");
  assert.equal(sanitized.token, "[redacted]");
  assert.equal(sanitized.cookie, "[redacted]");
  assert.equal(sanitized.importedJsonBody, "[redacted]");
  assert.equal(sanitized.learnerAnswer, "[redacted]");
  assert.equal(sanitized.user, "[redacted]");
  assert.equal(sanitized.session, "[redacted]");
  assert.deepEqual(sanitized.nested, {
    authorization: "[redacted]",
    statusCode: 403
  });
});

test("production logger emits structured logs without sensitive values", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalWarn = console.warn;
  const output: string[] = [];

  process.env.NODE_ENV = "production";
  console.warn = (message?: unknown) => {
    output.push(String(message));
  };

  try {
    logger.warn("auth failed", {
      route: "/auth/log-in",
      password: "secret-password",
      user: {
        id: "user-id",
        email: "learner@example.com"
      },
      hasUser: true
    });
  } finally {
    console.warn = originalWarn;
    if (originalEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv;
    }
  }

  assert.equal(output.length, 1);
  assert.doesNotMatch(output[0], /secret-password/);
  assert.doesNotMatch(output[0], /learner@example\.com|user-id/);
  assert.match(output[0], /"password":"\[redacted\]"/);
  assert.match(output[0], /"user":"\[redacted\]"/);
  assert.match(output[0], /"route":"\/auth\/log-in"/);
});

test("safe user error message does not expose raw internals", () => {
  const message = safeUserErrorMessage(
    new Error("relation question_bank_items does not exist; token=abc"),
    "Import failed safely."
  );

  assert.equal(message, "Import failed safely.");
  assert.doesNotMatch(message, /relation|token|question_bank_items/);
});
