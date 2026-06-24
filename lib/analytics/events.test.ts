import assert from "node:assert/strict";
import test from "node:test";

import {
  isAnalyticsEventName,
  sanitizeAnalyticsProperties
} from "./events.ts";

test("analytics event names are explicitly allow-listed", () => {
  assert.equal(isAnalyticsEventName("home_cta_click"), true);
  assert.equal(isAnalyticsEventName("mock_exam_start_click"), true);
  assert.equal(isAnalyticsEventName("learner_answer_submitted"), false);
});

test("analytics properties remove sensitive values and raw payloads", () => {
  const properties = sanitizeAnalyticsProperties({
    cta: "start-practice",
    location: "home",
    count: 2,
    enabled: true,
    email: "learner@example.com",
    token: "secret-token",
    answer: "private answer",
    rawPayload: "large raw object",
    missing: null
  });

  assert.deepEqual(properties, {
    cta: "start-practice",
    location: "home",
    count: 2,
    enabled: true
  });
});

test("analytics properties truncate long strings and reject unsafe numbers", () => {
  const properties = sanitizeAnalyticsProperties({
    label: "x".repeat(140),
    score: Number.NaN
  });

  assert.equal(properties.label, "x".repeat(120));
  assert.equal("score" in properties, false);
});
