import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_MOCK_EXAM_CONFIG } from "./mockExamConfig.ts";
import { buildMockExamForMode } from "./mockExamModeBuilder.ts";
import { normalizeMockAttempt } from "./db/progressMigration.ts";

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

function expectedTotal() {
  return (
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts.knowledge +
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["map-click"] +
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["route-drawing"]
  );
}

test("Practice Mock returns a valid mixed mock", () => {
  const result = buildMockExamForMode({
    mode: "practice",
    random: seededRandom(1)
  });

  assert.equal(result.mode, "practice");
  assert.equal(result.questions.length, expectedTotal());
  assert.equal(result.questions.filter((q) => q.type === "knowledge").length, 3);
  assert.equal(result.questions.filter((q) => q.type === "map-click").length, 3);
  assert.equal(
    result.questions.filter((q) => q.type === "route-drawing").length,
    2
  );
});

test("Exam Simulation returns a valid mock and marks the selected mode", () => {
  const result = buildMockExamForMode({
    mode: "exam-simulation",
    random: seededRandom(2)
  });

  assert.equal(result.mode, "exam-simulation");
  assert.equal(result.questions.length, expectedTotal());
  assert.equal(result.emptyStateReason, undefined);
});

test("Weak Areas Mock prioritises weak route performance", () => {
  const result = buildMockExamForMode({
    mode: "weak-areas",
    random: seededRandom(3),
    practiceAttempts: [
      {
        id: "p1",
        questionId: "kings-cross-to-euston",
        questionType: "route-drawing",
        score: 30,
        maxScore: 100,
        passed: false,
        createdAt: "2026-06-20T10:00:00.000Z"
      },
      {
        id: "p2",
        questionId: "knowledge-cardinal-direction",
        questionType: "knowledge",
        score: 90,
        maxScore: 100,
        passed: true,
        createdAt: "2026-06-21T10:00:00.000Z"
      },
      {
        id: "p3",
        questionId: "kings-cross-station",
        questionType: "map-click",
        score: 85,
        maxScore: 100,
        passed: true,
        createdAt: "2026-06-22T10:00:00.000Z"
      }
    ]
  });

  assert.equal(result.mode, "weak-areas");
  assert.equal(result.questions.length, expectedTotal());
  assert.equal(
    result.questions.filter((question) => question.type === "route-drawing")
      .length,
    4
  );
  assert.match(result.fallbackMessage ?? "", /route/i);
});

test("Weak Areas Mock falls back safely when there is not enough progress data", () => {
  const result = buildMockExamForMode({
    mode: "weak-areas",
    random: seededRandom(4),
    practiceAttempts: []
  });

  assert.equal(result.mode, "weak-areas");
  assert.equal(result.questions.length, expectedTotal());
  assert.match(result.fallbackMessage ?? "", /more saved progress/i);
});

test("Mistakes Mock uses failed questions when available", () => {
  const result = buildMockExamForMode({
    mode: "mistakes",
    random: seededRandom(5),
    practiceAttempts: [
      {
        id: "p1",
        questionId: "knowledge-cardinal-direction",
        questionType: "knowledge",
        score: 0,
        maxScore: 100,
        passed: false,
        createdAt: "2026-06-20T10:00:00.000Z"
      },
      {
        id: "p2",
        questionId: "kings-cross-station",
        questionType: "map-click",
        score: 0,
        maxScore: 100,
        passed: false,
        createdAt: "2026-06-21T10:00:00.000Z"
      }
    ],
    mockAttempts: [
      {
        id: "m1",
        result: {
          questionResults: [
            {
              questionId: "mock-route-kings-cross-to-euston",
              type: "route-drawing",
              score: 20,
              maxScore: 100,
              percentage: 20,
              passed: false
            }
          ]
        },
        createdAt: "2026-06-22T10:00:00.000Z",
        submittedAt: "2026-06-22T10:30:00.000Z"
      }
    ]
  });

  const ids = result.questions.map((question) => question.id);

  assert.equal(result.mode, "mistakes");
  assert.equal(result.questions.length, expectedTotal());
  assert.ok(ids.includes("knowledge-cardinal-direction"));
  assert.ok(ids.includes("mock-kings-cross-station"));
  assert.ok(ids.includes("mock-route-kings-cross-to-euston"));
  assert.match(result.fallbackMessage ?? "", /not enough saved mistakes/i);
});

test("Mistakes Mock returns an empty-state result when no mistakes exist", () => {
  const result = buildMockExamForMode({
    mode: "mistakes",
    random: seededRandom(6)
  });

  assert.equal(result.mode, "mistakes");
  assert.equal(result.questions.length, 0);
  assert.match(result.emptyStateReason ?? "", /No previous mistakes/i);
});

test("old saved mock attempts without mode normalize as practice mode", () => {
  const attempt = normalizeMockAttempt({
    id: "old-mock",
    questionIds: ["knowledge-cardinal-direction"],
    createdAt: "2026-06-20T10:00:00.000Z",
    submittedAt: "2026-06-20T10:30:00.000Z",
    score: 1,
    maxScore: 1,
    percentage: 100,
    passed: true
  });

  assert.equal(attempt.mode, "practice");
});
