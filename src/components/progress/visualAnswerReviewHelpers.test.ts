import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  getInitialAnswerVisibility,
  hasUsableMapClickVisualData,
  hasUsableRouteGeometry,
  retryHrefForMistakeType,
  sortMistakesNewestFirst,
  toggleAnswerVisibility
} from "./visualAnswerReviewHelpers.ts";

test("visual answer review hides answers by default and toggles visibility", () => {
  assert.equal(getInitialAnswerVisibility(), false);
  assert.equal(toggleAnswerVisibility(false), true);
  assert.equal(toggleAnswerVisibility(true), false);
});

test("visual answer retry links target the correct practice pages", () => {
  assert.equal(retryHrefForMistakeType("knowledge"), "/practice/knowledge");
  assert.equal(retryHrefForMistakeType("map-click"), "/practice/map-click");
  assert.equal(retryHrefForMistakeType("route"), "/practice/routes");
});

test("visual answer helpers tolerate missing map-click coordinates", () => {
  assert.equal(hasUsableMapClickVisualData(null, null), false);
  assert.equal(
    hasUsableMapClickVisualData(
      { latitude: 51.5, longitude: -0.12 },
      undefined
    ),
    true
  );
  assert.equal(
    hasUsableMapClickVisualData(undefined, { lat: 51.5, lng: -0.12 }),
    true
  );
});

test("visual answer helpers tolerate missing route geometry", () => {
  assert.equal(hasUsableRouteGeometry(null), false);
  assert.equal(hasUsableRouteGeometry([{ x: 1, y: 1 }]), false);
  assert.equal(
    hasUsableRouteGeometry([
      { x: 1, y: 1 },
      { x: 2, y: 2 }
    ]),
    true
  );
});

test("mistake sorting remains newest first", () => {
  const sorted = sortMistakesNewestFirst([
    { id: "old", date: "2026-06-21T10:00:00.000Z" },
    { id: "new", date: "2026-06-23T10:00:00.000Z" },
    { id: "middle", date: "2026-06-22T10:00:00.000Z" }
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    ["new", "middle", "old"]
  );
});

test("mistake review uses responsive master detail layout", () => {
  const source = readFileSync(
    new URL("./MistakeReview.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /xl:grid-cols-\[minmax\(320px,430px\)_minmax\(0,1fr\)\]/);
  assert.match(source, /xl:max-h-\[calc\(100vh-11rem\)\]/);
  assert.match(source, /xl:overflow-y-auto/);
  assert.match(source, /xl:hidden/);
  assert.match(source, /hidden xl:block/);
  assert.match(source, /sticky top-4/);
  assert.match(source, /border-road bg-blue-50 ring-1 ring-road\/20/);
  assert.match(source, /formatAnswerStatus\(mistake\.userAnswer\)/);
  assert.match(source, /MistakeDetailPanel/);
});
