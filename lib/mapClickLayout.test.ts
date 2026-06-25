import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const mapClickQuestionSource = readFileSync(
  path.join(process.cwd(), "src/components/questions/MapClickQuestion.tsx"),
  "utf8"
);

test("active map-click question does not render the old side answer panel", () => {
  assert.doesNotMatch(mapClickQuestionSource, /Answer panel/i);
  assert.doesNotMatch(mapClickQuestionSource, /Clicked latitude/);
  assert.doesNotMatch(mapClickQuestionSource, /Clicked longitude/);
  assert.doesNotMatch(mapClickQuestionSource, /xl:grid-cols/);
});

test("active map-click question keeps inline selection and submit behaviour", () => {
  assert.match(mapClickQuestionSource, /Selection saved/);
  assert.match(mapClickQuestionSource, /No selection yet/);
  assert.match(mapClickQuestionSource, /Submit selected location/);
  assert.match(mapClickQuestionSource, /onClick=\{submitAnswer\}/);
  assert.match(mapClickQuestionSource, /answerHandler\.current\?\.\(answerResult\)/);
});
