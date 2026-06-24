import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const homeSource = readFileSync(path.join(projectRoot, "app/page.tsx"), "utf8");

test("home page promotes learner CTAs and map practice routes", () => {
  assert.match(homeSource, /Start practice/);
  assert.match(homeSource, /Take a mock exam/);
  assert.match(homeSource, /View progress/);
  assert.match(homeSource, /\/practice\/map-click/);
  assert.match(homeSource, /\/practice\/routes/);
  assert.match(homeSource, /\/practice\/knowledge/);
  assert.match(homeSource, /\/maps\/generated\/kings-cross-euston-driver-training-atlas\.svg/);
});

test("home page stays public and does not expose admin tooling", () => {
  assert.doesNotMatch(homeSource, /\/admin/);
  assert.doesNotMatch(homeSource, /draft|archived|question_bank_items/i);
});
