import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPracticeSessionSummary,
  filterByPracticeFilter,
  getPracticeTopicStats,
  normalizePracticeQuestionFilter,
  topicHref,
  upsertPracticeSessionResult,
  type PracticeSessionResult
} from "./practiceSession.ts";

const routePlanningResult: PracticeSessionResult = {
  questionId: "route-1",
  prompt: "Plan a route",
  questionType: "route-drawing",
  topic: "Route planning",
  difficulty: "medium",
  passed: false,
  percentage: 45,
  learnerAnswer: "5 drawn route points",
  correctAnswer: "A to B",
  feedback: "Route missed a key section."
};

const mapResult: PracticeSessionResult = {
  questionId: "map-1",
  prompt: "Click a station",
  questionType: "map-click",
  topic: "Stations and transport hubs",
  difficulty: "easy",
  passed: true,
  percentage: 100,
  learnerAnswer: "20m from target",
  correctAnswer: "Station",
  feedback: "Inside the accepted area."
};

test("practice topic stats expose available question counts per topic", () => {
  const stats = getPracticeTopicStats();
  const stations = stats.find(
    (topic) => topic.topic === "Stations and transport hubs"
  );
  const routePlanning = stats.find((topic) => topic.topic === "Route planning");

  assert.ok(stations);
  assert.ok(routePlanning);
  assert.ok(stations.total > 0);
  assert.ok(stations.knowledge > 0 || stations.mapClick > 0);
  assert.ok(routePlanning.routeDrawing > 0);
});

test("practice filters normalise unsafe topic and difficulty values", () => {
  assert.deepEqual(normalizePracticeQuestionFilter("Route planning", "hard"), {
    topic: "Route planning",
    difficulty: "hard"
  });
  assert.deepEqual(
    normalizePracticeQuestionFilter("Equality and accessibility", "medium"),
    {
      topic: "Equality and accessibility",
      difficulty: "medium"
    }
  );
  assert.deepEqual(normalizePracticeQuestionFilter("Legacy topic", "expert"), {
    topic: "all",
    difficulty: "all"
  });
});

test("practice filters apply topic and difficulty to questions", () => {
  const questions = [
    {
      id: "one",
      category: "Route planning",
      difficulty: "medium" as const
    },
    {
      id: "two",
      category: "Stations and transport hubs",
      difficulty: "medium" as const
    },
    {
      id: "three",
      tags: ["Route planning"],
      difficulty: "hard" as const
    },
    {
      id: "seru",
      category: "Equality and accessibility",
      difficulty: "medium" as const
    }
  ];

  assert.deepEqual(
    filterByPracticeFilter(questions, {
      topic: "Route planning",
      difficulty: "all"
    }).map((question) => question.id),
    ["one", "three"]
  );
  assert.deepEqual(
    filterByPracticeFilter(questions, {
      topic: "Route planning",
      difficulty: "hard"
    }).map((question) => question.id),
    ["three"]
  );
  assert.deepEqual(
    filterByPracticeFilter(questions, {
      topic: "Equality and accessibility",
      difficulty: "medium"
    }).map((question) => question.id),
    ["seru"]
  );
});

test("practice topic hrefs encode topic and difficulty filters", () => {
  assert.equal(
    topicHref("/practice/routes", {
      topic: "Route planning",
      difficulty: "hard"
    }),
    "/practice/routes?topic=Route+planning&difficulty=hard"
  );
  assert.equal(topicHref("/practice/routes", { topic: "all" }), "/practice/routes");
});

test("practice session summary reports wrong answers and weak topics", () => {
  const summary = buildPracticeSessionSummary([routePlanningResult, mapResult]);

  assert.equal(summary.answered, 2);
  assert.equal(summary.correct, 1);
  assert.equal(summary.incorrect, 1);
  assert.equal(summary.percentage, 50);
  assert.deepEqual(summary.weakTopics, ["Route planning"]);
  assert.deepEqual(
    summary.wrongAnswers.map((result) => result.questionId),
    ["route-1"]
  );
  assert.match(summary.recommendation, /Route planning/);
});

test("session result upsert replaces the latest result for a question", () => {
  const updated = upsertPracticeSessionResult(
    [routePlanningResult],
    {
      ...routePlanningResult,
      passed: true,
      percentage: 100,
      learnerAnswer: "Improved route"
    }
  );

  assert.equal(updated.length, 1);
  assert.equal(updated[0].passed, true);
  assert.equal(updated[0].learnerAnswer, "Improved route");
});
