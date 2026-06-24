import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "../db/progressMigration.ts";

export type QuestionStat = {
  questionId: string;
  attempts: number;
  correct: number;
  successRate: number;
};

function addStat(
  stats: Map<string, { attempts: number; correct: number }>,
  questionId: string,
  passed: boolean | null
) {
  const current = stats.get(questionId) ?? { attempts: 0, correct: 0 };
  current.attempts += 1;
  current.correct += passed ? 1 : 0;
  stats.set(questionId, current);
}

export function getQuestionStatsFromAttempts(
  practiceAttempts: unknown[],
  mockAttempts: unknown[]
): QuestionStat[] {
  const stats = new Map<string, { attempts: number; correct: number }>();
  const practice = normalizePracticeAttempts(
    practiceAttempts
  ) as NormalizedPracticeAttempt[];
  const mock = normalizeMockAttempts(mockAttempts) as NormalizedMockAttempt[];

  practice.forEach((attempt) => {
    addStat(stats, attempt.questionId, attempt.passed);
  });

  mock.forEach((attempt) => {
    attempt.questionResults.forEach((result) => {
      addStat(stats, result.questionId, result.passed);
    });
  });

  return [...stats.entries()]
    .map(([questionId, value]) => ({
      questionId,
      attempts: value.attempts,
      correct: value.correct,
      successRate:
        value.attempts === 0
          ? 0
          : Math.round((value.correct / value.attempts) * 100)
    }))
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
}
