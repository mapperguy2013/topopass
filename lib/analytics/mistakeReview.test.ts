import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aggregateMistakes,
  filterMistakes,
  sortMistakes,
  type MistakeAttemptView
} from "./mistakeReview.ts";

const mistakes: MistakeAttemptView[] = [
  {
    id: "a1",
    questionId: "knowledge-1",
    type: "knowledge",
    title: "Which way is north?",
    category: "Directions",
    userAnswer: "South",
    correctAnswer: "North",
    score: "0/1",
    percentage: 0,
    date: "2026-06-21T09:00:00.000Z",
    explanation: "North is the accepted direction.",
    tip: "Check the compass."
  },
  {
    id: "a2",
    questionId: "map-1",
    type: "map-click",
    title: "Click on Euston Station.",
    category: "Rail stations",
    userAnswer: "Clicked too far away",
    correctAnswer: "Euston Station",
    score: "0/1",
    percentage: 20,
    date: "2026-06-22T09:00:00.000Z"
  },
  {
    id: "a3",
    questionId: "knowledge-1",
    type: "knowledge",
    title: "Which way is north?",
    category: "Directions",
    userAnswer: "East",
    correctAnswer: "North",
    score: "0/1",
    percentage: 10,
    date: "2026-06-23T09:00:00.000Z"
  },
  {
    id: "a4",
    questionId: "route-1",
    type: "route",
    title: "King's Cross to Euston",
    category: "route-planning",
    userAnswer: "Long route",
    correctAnswer: "Accepted route",
    score: "45/100",
    percentage: 45,
    date: "2026-06-20T09:00:00.000Z"
  }
];

test("aggregateMistakes groups repeated misses and tracks latest miss", () => {
  const aggregated = aggregateMistakes(mistakes);
  const knowledge = aggregated.find((mistake) => mistake.questionId === "knowledge-1");

  assert.equal(aggregated.length, 3);
  assert.equal(knowledge?.missedCount, 2);
  assert.equal(knowledge?.latestMissedDate, "2026-06-23T09:00:00.000Z");
  assert.equal(knowledge?.lowestPercentage, 0);
});

test("aggregateMistakes applies reviewed status by review key", () => {
  const aggregated = aggregateMistakes(mistakes, ["knowledge:knowledge-1"]);
  const knowledge = aggregated.find((mistake) => mistake.questionId === "knowledge-1");

  assert.equal(knowledge?.reviewed, true);
});

test("filterMistakes filters by type and search text", () => {
  const aggregated = aggregateMistakes(mistakes);
  const mapOnly = filterMistakes(aggregated, { type: "map-click" });
  const stationSearch = filterMistakes(aggregated, { search: "station" });

  assert.deepEqual(mapOnly.map((mistake) => mistake.type), ["map-click"]);
  assert.deepEqual(
    stationSearch.map((mistake) => mistake.questionId),
    ["map-1"]
  );
});

test("filterMistakes filters by reviewed state", () => {
  const aggregated = aggregateMistakes(mistakes, ["knowledge:knowledge-1"]);

  assert.deepEqual(
    filterMistakes(aggregated, { reviewed: "reviewed" }).map(
      (mistake) => mistake.questionId
    ),
    ["knowledge-1"]
  );
  assert.ok(
    filterMistakes(aggregated, { reviewed: "unreviewed" }).every(
      (mistake) => !mistake.reviewed
    )
  );
});

test("sortMistakes supports newest, weakest, and most repeated", () => {
  const aggregated = aggregateMistakes(mistakes);

  assert.equal(sortMistakes(aggregated, "newest")[0].questionId, "knowledge-1");
  assert.equal(sortMistakes(aggregated, "weakest")[0].questionId, "knowledge-1");
  assert.equal(
    sortMistakes(aggregated, "most-repeated")[0].questionId,
    "knowledge-1"
  );
});
