import assert from "node:assert/strict";
import test from "node:test";

import {
  learnSections,
  learnSkillTypes,
  learningPathSteps,
  lessonCards,
  validLearnHrefs
} from "./learnContent.ts";

const validHrefSet = new Set<string>(validLearnHrefs);
const validSkillTypeSet = new Set<string>(learnSkillTypes);
const forbiddenClaims = [
  /official\s+TfL\s+answer/i,
  /guaranteed\s+exam\s+route/i,
  /guarantees?\s+exact\s+TfL\s+routes?/i
];

function assertUniqueIds(items: { id: string }[], label: string) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
}

function assertText(value: string, label: string) {
  assert.ok(value.trim().length >= 8, `${label} must contain useful text`);
  forbiddenClaims.forEach((pattern) => {
    assert.equal(
      pattern.test(value),
      false,
      `${label} must not imply official or guaranteed route answers`
    );
  });
}

test("lesson cards have unique IDs, valid copy, skill types, and hrefs", () => {
  assertUniqueIds(lessonCards, "lesson card");

  lessonCards.forEach((card) => {
    assertText(card.title, `${card.id} title`);
    assertText(card.description, `${card.id} description`);
    assertText(card.actionLabel, `${card.id} action`);
    assert.ok(
      validSkillTypeSet.has(card.skillType),
      `${card.id} has an invalid skill type`
    );
    assert.ok(validHrefSet.has(card.href), `${card.id} has an invalid href`);
  });
});

test("learning path steps have unique IDs and valid hrefs", () => {
  assertUniqueIds(learningPathSteps, "learning path");

  learningPathSteps.forEach((step) => {
    assertText(step.title, `${step.id} title`);
    assertText(step.description, `${step.id} description`);
    assertText(step.actionLabel, `${step.id} action`);
    assert.ok(validHrefSet.has(step.href), `${step.id} has an invalid href`);
  });
});

test("learn sections cover the required guidance areas", () => {
  assertUniqueIds(learnSections, "learn section");
  assert.deepEqual(
    learnSections.map((section) => section.id),
    [
      "route-planning-map-skills",
      "map-click-skills",
      "knowledge-skills",
      "seru-preparation",
      "mock-exam-preparation",
      "mistake-review"
    ]
  );

  learnSections.forEach((section) => {
    assertText(section.title, `${section.id} title`);
    assertText(section.description, `${section.id} description`);
    assertText(section.actionLabel, `${section.id} action`);
    assert.ok(
      validSkillTypeSet.has(section.skillType),
      `${section.id} has an invalid skill type`
    );
    assert.ok(validHrefSet.has(section.href), `${section.id} has an invalid href`);
    assert.ok(section.guidance.length >= 4, `${section.id} needs guidance items`);
    section.guidance.forEach((item, index) =>
      assertText(item, `${section.id} guidance ${index + 1}`)
    );
  });
});
