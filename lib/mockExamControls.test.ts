import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const mockTestFlowSource = readFileSync(
  path.join(process.cwd(), "src/components/mock-test/MockTestFlow.tsx"),
  "utf8"
);

test("active mock exam flag control stays near the question navigator", () => {
  assert.match(
    mockTestFlowSource,
    /aria-label=\{\s*currentQuestionFlagged\s*\?\s*"Remove flag from this question"\s*:\s*"Flag this question"\s*\}/
  );
  assert.match(
    mockTestFlowSource,
    /<FlagIcon active=\{currentQuestionFlagged\} \/>/
  );
  assert.match(
    mockTestFlowSource,
    /toggleQuestionFlag\(currentQuestion\.id\)/
  );
});

test("active mock exam omits change mode and the visible navigator legend", () => {
  assert.doesNotMatch(mockTestFlowSource, />Change mode</);
  assert.doesNotMatch(mockTestFlowSource, /Outlined: unanswered/);
  assert.doesNotMatch(mockTestFlowSource, /Dark: answered/);
  assert.doesNotMatch(mockTestFlowSource, /Blue: current/);
  assert.doesNotMatch(mockTestFlowSource, /Amber dot: flagged/);
});
