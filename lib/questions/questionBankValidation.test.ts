import assert from "node:assert/strict";
import test from "node:test";

import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { seruQuestionBank } from "../seruQuestions.ts";
import {
  PHV_HANDBOOK_SOURCE,
  phvHandbookQuestions,
  phvHandbookSections
} from "../seruPhvQuestions.ts";
import {
  advancedSentenceCompletionQuestions,
  clearAllBlanks,
  clearBlank,
  placeWordInBlank,
  scoreMultiSentenceCompletion,
  scoreSentenceCompletion,
  sentenceCompletionQuestions
} from "../seruEnglishQuestions.ts";
import {
  SERU_READING_UNDERSTANDING_QUESTIONS,
  scoreSeruReadingQuestion,
  validateSeruReadingUnderstandingQuestions
} from "../seruReadingQuestions.ts";
import { demoMapClickQuestions } from "../mapClickQuestions.ts";
import {
  getActiveRouteQuestions,
  routeQuestions
} from "../../src/data/routeQuestions.ts";
import { DEFAULT_MOCK_EXAM_CONFIG } from "../mockExamConfig.ts";
import { selectMockExamQuestions } from "../mockTestQuestions.ts";
import {
  isQuestionTopic,
  isSeruQuestionTopic,
  QUESTION_TOPICS
} from "./topics.ts";

function assertUniqueIds(label: string, ids: string[]) {
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.deepEqual(
    [...new Set(duplicates)],
    [],
    `${label} contains duplicate IDs: ${[...new Set(duplicates)].join(", ")}`
  );
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

test("question banks have unique stable IDs", () => {
  assertUniqueIds(
    "knowledge question bank",
    knowledgeQuestionBank.map((question) => question.id)
  );
  assertUniqueIds(
    "SERU question bank",
    seruQuestionBank.map((question) => question.id)
  );
  assertUniqueIds(
    "PHV handbook question bank",
    phvHandbookQuestions.map((question) => question.id)
  );
  assertUniqueIds(
    "SERU English single sentence bank",
    sentenceCompletionQuestions.map((question) => question.id)
  );
  assertUniqueIds(
    "SERU English advanced sentence bank",
    advancedSentenceCompletionQuestions.map((question) => question.id)
  );
  assertUniqueIds(
    "SERU reading understanding bank",
    SERU_READING_UNDERSTANDING_QUESTIONS.map((question) => question.id)
  );
  assertUniqueIds(
    "map-click question bank",
    demoMapClickQuestions.map((question) => question.id)
  );
  assertUniqueIds(
    "route question bank",
    routeQuestions.map((question) => question.id)
  );
});

test("knowledge questions have valid options, answers, explanations, and tips", () => {
  assert.ok(
    knowledgeQuestionBank.length >= 40,
    "Stage 23 should keep the knowledge bank meaningfully expanded"
  );

  knowledgeQuestionBank.forEach((question) => {
    assert.equal(question.type, "knowledge", question.id);
    assert.ok(question.id.startsWith("knowledge-"), question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.options.length >= 2, question.id);
    assertUniqueIds(
      `knowledge options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    assert.ok(
      question.options.includes(question.correctAnswer),
      `${question.id} correct answer must appear in options`
    );
    assert.ok(question.category.trim().length > 0, question.id);
    assert.ok(isQuestionTopic(question.category), question.id);
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
  });
});

test("SERU questions are original active starter content with valid topics", () => {
  const starterQuestions = seruQuestionBank.filter(
    (question) => question.practiceArea !== "seru-phv-handbook"
  );

  assert.ok(
    starterQuestions.length >= 20 && starterQuestions.length <= 30,
    "Stage 39.5 should add a starter SERU question bank without overbuilding"
  );

  starterQuestions.forEach((question) => {
    assert.equal(question.type, "knowledge", question.id);
    assert.equal(question.questionFamily, "seru", question.id);
    assert.ok(question.id.startsWith("seru-"), question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.options.length >= 2, question.id);
    assertUniqueIds(
      `SERU options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    assert.ok(
      question.options.includes(question.correctAnswer),
      `${question.id} correct answer must appear in options`
    );
    assert.ok(isSeruQuestionTopic(question.category), question.id);
    assert.ok(question.isActive, question.id);
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
    assert.match(
      question.sourceNote ?? "",
      /Original SERU-style private hire learning content/
    );
  });

  const starterTopics = new Set(starterQuestions.map((question) => question.category));
  assert.ok(
    [
      "Driver licensing and responsibilities",
      "Passenger safety",
      "Safeguarding",
      "Equality and accessibility",
      "Customer service",
      "Complaints and professionalism",
      "Private hire regulations",
      "Journey planning and conduct",
      "Lost property",
      "Road safety awareness"
    ].every((topic) => starterTopics.has(topic)),
    "SERU starter bank should cover every SERU topic"
  );
});

test("PHV Driver Handbook practice has exactly 100 valid original questions", () => {
  assert.equal(phvHandbookSections.length, 10);
  assert.equal(phvHandbookQuestions.length, 100);

  phvHandbookSections.forEach((section) => {
    const sectionQuestions = phvHandbookQuestions.filter(
      (question) => question.sectionId === section.id
    );

    assert.equal(sectionQuestions.length, 10, section.name);
    assert.ok(isSeruQuestionTopic(section.name), section.name);

    sectionQuestions.forEach((question) => {
      assert.equal(question.type, "knowledge", question.id);
      assert.equal(question.questionFamily, "seru", question.id);
      assert.equal(question.practiceArea, "seru-phv-handbook", question.id);
      assert.equal(question.questionSubtype, "multiple_choice", question.id);
      assert.ok(question.id.startsWith("seru-phv-"), question.id);
      assert.equal(question.options.length, 4, question.id);
      assertUniqueIds(
        `PHV options for ${question.id}`,
        question.options.map((option) => option.trim())
      );
      assert.ok(question.options.includes(question.correctAnswer), question.id);
      assert.equal(question.category, section.name, question.id);
      assert.equal(question.sectionName, section.name, question.id);
      assert.equal(question.handbookSection, section.handbookSection, question.id);
      assert.equal(question.source, PHV_HANDBOOK_SOURCE, question.id);
      assert.match(question.sourceNote, /original TopoPass practice question/);
      assert.ok(question.topic?.trim(), `${question.id} needs topic`);
      assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
      assert.ok(question.tip?.trim(), `${question.id} needs tip`);
      assert.ok(
        ["beginner", "intermediate", "advanced"].includes(
          question.seruDifficulty ?? ""
        ),
        `${question.id} needs SERU difficulty`
      );
    });
  });
});

test("SERU English single sentence completion bank is valid and scores answers", () => {
  assert.equal(sentenceCompletionQuestions.length, 20);
  assert.ok(isSeruQuestionTopic("SERU English - Complete the Sentence"));

  sentenceCompletionQuestions.forEach((question) => {
    assert.equal(question.type, "sentence_completion", question.id);
    assert.ok(question.id.startsWith("seru-english-single-"), question.id);
    assert.equal(question.category, "SERU English - Complete the Sentence");
    assert.match(question.sentence, /___/, question.id);
    assert.equal(question.options.length, 4, question.id);
    assertUniqueIds(
      `SERU English options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    assert.ok(question.options.includes(question.correctAnswer), question.id);
    assert.ok(question.explanation.trim(), question.id);
    assert.equal(scoreSentenceCompletion(question, question.correctAnswer), true);
    assert.equal(scoreSentenceCompletion(question, "not-the-answer"), false);
  });
});

test("SERU English advanced sentence completion bank is valid and scores all blanks", () => {
  assert.equal(advancedSentenceCompletionQuestions.length, 20);
  assert.ok(isSeruQuestionTopic("SERU English - Advanced Sentence Completion"));
  const advancedQuestionText = advancedSentenceCompletionQuestions
    .map((question) => `${question.sentence} ${question.options.join(" ")}`)
    .join(" ");

  advancedSentenceCompletionQuestions.forEach((question) => {
    assert.equal(question.type, "multi_sentence_completion", question.id);
    assert.ok(question.id.startsWith("seru-english-advanced-"), question.id);
    assert.equal(question.category, "SERU English - Advanced Sentence Completion");
    assert.equal(question.sentence.match(/___/g)?.length, 3, question.id);
    assert.equal(question.options.length, 7, question.id);
    assert.equal(question.correctAnswers.length, 3, question.id);
    assertUniqueIds(
      `SERU advanced options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    question.correctAnswers.forEach((answer) =>
      assert.ok(question.options.includes(answer), `${question.id}: ${answer}`)
    );
    assertUniqueIds(
      `SERU advanced correct answers for ${question.id}`,
      [...question.correctAnswers]
    );
    assert.ok(question.explanation.trim(), question.id);

    const fullScore = scoreMultiSentenceCompletion(
      question,
      question.correctAnswers
    );
    assert.deepEqual(fullScore.blankResults, [true, true, true], question.id);
    assert.equal(fullScore.correct, true, question.id);

    const partialScore = scoreMultiSentenceCompletion(question, [
      question.correctAnswers[0],
      "wrong",
      question.correctAnswers[2]
    ]);
    assert.deepEqual(partialScore.blankResults, [true, false, true], question.id);
    assert.equal(partialScore.correct, false, question.id);
  });

  assert.deepEqual(clearAllBlanks(3), [null, null, null]);
  assert.deepEqual(placeWordInBlank(["their", null, null], 1, "their"), [
    null,
    "their",
    null
  ]);
  assert.deepEqual(clearBlank(["their", "there", "they"], 1), [
    "their",
    null,
    "they"
  ]);
  assert.match(advancedQuestionText, /must|should|may|cannot/);
  assert.match(advancedQuestionText, /before|after|while|when|unless/);
  assert.match(advancedQuestionText, /because|therefore|however/);
  assert.match(advancedQuestionText, /appropriate|reasonable|serious|accurate|suitable|licensed/);
  assert.match(advancedQuestionText, /through|between|from|at|on|to/);
});

test("SERU reading and understanding bank has 20 valid original passages", () => {
  assert.equal(SERU_READING_UNDERSTANDING_QUESTIONS.length, 20);
  assert.ok(isSeruQuestionTopic("SERU Reading and Understanding"));
  assert.equal(validateSeruReadingUnderstandingQuestions(), true);

  SERU_READING_UNDERSTANDING_QUESTIONS.forEach((question) => {
    const passageWordCount = question.passage.trim().split(/\s+/).length;

    assert.equal(question.type, "reading_comprehension", question.id);
    assert.equal(question.questionFamily, "seru", question.id);
    assert.equal(question.categoryId, "seru_reading_understanding", question.id);
    assert.equal(question.category, "SERU Reading and Understanding", question.id);
    assert.ok(question.id.startsWith("seru-reading-"), question.id);
    assert.ok(question.title.trim().length > 0, question.id);
    assert.ok(question.question.trim().length > 0, question.id);
    assert.ok(
      passageWordCount >= 70 && passageWordCount <= 130,
      `${question.id} has ${passageWordCount} passage words`
    );
    assert.equal(question.options.length, 4, question.id);
    assertUniqueIds(
      `SERU reading options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    assert.ok(question.options.includes(question.correctAnswer), question.id);
    assert.ok(question.explanation.trim(), question.id);
    assert.ok(question.handbookSection.trim(), question.id);
    assert.ok(question.topic.trim(), question.id);
    assert.equal(scoreSeruReadingQuestion(question, question.correctAnswer), true);
    assert.equal(scoreSeruReadingQuestion(question, "not-the-answer"), false);
  });
});

test("map-click questions have valid coordinates, tolerances, explanations, and tips", () => {
  assert.ok(
    demoMapClickQuestions.length >= 30,
    "Stage 23 should keep the map-click bank meaningfully expanded"
  );

  demoMapClickQuestions.forEach((question) => {
    assert.equal(question.type, "map-click", question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.targetName.trim().length > 0, question.id);
    assert.ok(isValidLatitude(question.answer.lat), `${question.id} latitude`);
    assert.ok(isValidLongitude(question.answer.lng), `${question.id} longitude`);
    assert.ok(question.toleranceMeters > 0, `${question.id} tolerance`);
    assert.ok(question.category.trim().length > 0, question.id);
    assert.ok(isQuestionTopic(question.category), question.id);
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
    assert.ok(
      question.acceptedAreaDescription?.trim(),
      `${question.id} needs accepted area description`
    );
  });
});

test("route questions have valid endpoints, stored geometry, explanations, and tips", () => {
  assert.ok(
    routeQuestions.length >= 10,
    "Stage 23 should keep the route bank expanded from the original prototype set"
  );

  routeQuestions.forEach((question) => {
    assert.ok(question.id.trim().length > 0, question.id);
    assert.ok(question.title.trim().length > 0, question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.fromLabel.trim().length > 0, question.id);
    assert.ok(question.toLabel.trim().length > 0, question.id);
    assert.ok(isValidLatitude(question.from.lat), `${question.id} from lat`);
    assert.ok(isValidLongitude(question.from.lng), `${question.id} from lng`);
    assert.ok(isValidLatitude(question.to.lat), `${question.id} to lat`);
    assert.ok(isValidLongitude(question.to.lng), `${question.id} to lng`);
    assert.ok(
      question.acceptedRoute?.geometry.length &&
        question.acceptedRoute.geometry.length > 1,
      `${question.id} needs accepted route geometry`
    );
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
    assert.ok(question.idealRouteDescription?.trim(), question.id);
    assert.ok(isQuestionTopic(question.tags[0]), question.id);
  });
});

test("static question banks use the Stage 36 topic structure", () => {
  const staticTopics = new Set([
    ...knowledgeQuestionBank.map((question) => question.category),
    ...demoMapClickQuestions.map((question) => question.category),
    ...routeQuestions.map((question) => question.tags[0])
  ]);

  assert.ok(staticTopics.size >= 8);
  assert.ok(staticTopics.has("Route planning"));
  assert.ok(staticTopics.has("Stations and transport hubs"));
  assert.ok(staticTopics.has("Map interpretation"));
  for (const topic of staticTopics) {
    assert.ok(
      QUESTION_TOPICS.includes(topic as (typeof QUESTION_TOPICS)[number]),
      `Unexpected topic: ${topic}`
    );
  }
});

test("topographical knowledge and SERU knowledge banks stay separated", () => {
  assert.ok(
    knowledgeQuestionBank.every(
      (question) =>
        question.questionFamily !== "seru" &&
        question.id.startsWith("knowledge-") &&
        isQuestionTopic(question.category)
    )
  );
  assert.ok(
    seruQuestionBank.every(
      (question) =>
        question.questionFamily === "seru" &&
        question.id.startsWith("seru-") &&
        isSeruQuestionTopic(question.category)
    )
  );
});

test("mock exam selection still works with expanded banks", () => {
  const questions = selectMockExamQuestions(
    DEFAULT_MOCK_EXAM_CONFIG,
    () => 0.42
  );
  const expectedTotal =
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts.knowledge +
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["map-click"] +
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["route-drawing"];

  assert.equal(questions.length, expectedTotal);
  assert.equal(
    questions.filter((question) => question.type === "knowledge").length,
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts.knowledge
  );
  assert.equal(
    questions.filter((question) => question.type === "map-click").length,
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["map-click"]
  );
  assert.equal(
    questions.filter((question) => question.type === "route-drawing").length,
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["route-drawing"]
  );
  assert.ok(
    questions.every((question) => !question.id.startsWith("seru-")),
    "Topographical mock exam selection must not include SERU questions"
  );
  assert.ok(getActiveRouteQuestions().length >= 10);
});
