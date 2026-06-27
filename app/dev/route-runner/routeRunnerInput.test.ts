import assert from "node:assert/strict";
import test from "node:test";
import { parseCommaSeparatedIds } from "./routeRunnerInput.ts";

test("parseCommaSeparatedIds parses comma-separated node IDs", () => {
  assert.deepEqual(parseCommaSeparatedIds("node-a,node-b,node-c"), ["node-a", "node-b", "node-c"]);
});

test("parseCommaSeparatedIds trims extra whitespace", () => {
  assert.deepEqual(parseCommaSeparatedIds(" node-a, node-b "), ["node-a", "node-b"]);
});

test("parseCommaSeparatedIds returns an empty array for empty input", () => {
  assert.deepEqual(parseCommaSeparatedIds(""), []);
});

test("parseCommaSeparatedIds ignores duplicate commas", () => {
  assert.deepEqual(parseCommaSeparatedIds("node-a,,node-b"), ["node-a", "node-b"]);
});
