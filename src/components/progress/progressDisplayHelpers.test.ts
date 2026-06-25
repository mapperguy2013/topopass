import assert from "node:assert/strict";
import { test } from "node:test";
import { formatAttemptTitle, formatAttemptType } from "./progressDisplayHelpers.ts";

test("progress display helpers format learner-friendly attempt types", () => {
  assert.equal(formatAttemptType("map-click"), "Map click");
  assert.equal(formatAttemptType("route-drawing"), "Route practice");
  assert.equal(formatAttemptType("knowledge"), "Knowledge");
  assert.equal(formatAttemptType("mock-test"), "Mock exam");
  assert.equal(formatAttemptType("unknown"), "Practice");
});

test("progress display helpers avoid raw slug titles where possible", () => {
  assert.equal(
    formatAttemptTitle("knowledge-road-atlas-index", "knowledge"),
    "Knowledge road atlas index"
  );
  assert.equal(
    formatAttemptTitle("route_kings_cross_euston", "route-drawing"),
    "Route kings cross euston"
  );
  assert.equal(formatAttemptTitle("", "map-click"), "Map click");
  assert.equal(formatAttemptTitle("unknown-question", "knowledge"), "Knowledge");
  assert.equal(formatAttemptTitle("Mock exam", "mock-test"), "Mock exam");
});
