import assert from "node:assert/strict";
import { test } from "node:test";
import { saveMockAttempt, loadMockAttempt } from "./mockAttemptRepository.ts";
import { savePracticeAttempt } from "./practiceAttemptRepository.ts";
import { getUserProgressSummary } from "./progressRepository.ts";

test("mock attempt repository reports static fallback when Supabase is unavailable", async () => {
  const saveResult = await saveMockAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      questionIds: ["knowledge-cardinal-direction"],
      answers: {}
    },
    { client: null }
  );
  const loadResult = await loadMockAttempt("attempt-id", { client: null });

  assert.equal(saveResult.source, "static");
  assert.equal(saveResult.persisted, false);
  assert.equal(loadResult.source, "static");
  assert.equal(loadResult.attempt, null);
});

test("practice attempts are not persisted without Supabase", async () => {
  const result = await savePracticeAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      practiceMode: "route-drawing",
      questionId: "kings-cross-to-euston",
      questionType: "route-drawing"
    },
    { client: null }
  );

  assert.equal(result.source, "static");
  assert.equal(result.persisted, false);
});

test("progress repository returns empty summary without Supabase", async () => {
  const result = await getUserProgressSummary(
    "00000000-0000-0000-0000-000000000001",
    { client: null }
  );

  assert.equal(result.source, "static");
  assert.equal(result.progress.mockAttempts, 0);
  assert.equal(result.progress.practiceAttempts, 0);
  assert.equal(result.progress.averageMockPercentage, null);
});
