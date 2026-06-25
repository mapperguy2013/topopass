import type { MockExamResult } from "./mockExamEngine.ts";

export type MockScoreRingSummary = {
  correct: number;
  wrong: number;
  totalQuestions: number;
  answeredQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
  passPercentage: number;
  passed: boolean;
  resultLabel: string;
};

export function calculateMockScoreRingSummary(
  result: MockExamResult
): MockScoreRingSummary {
  const totalQuestions = Math.max(0, result.totalQuestions);
  const correct = Math.max(0, result.passedQuestions);
  const wrong = Math.max(0, totalQuestions - correct);

  return {
    correct,
    wrong,
    totalQuestions,
    answeredQuestions: Math.max(0, result.answeredQuestions),
    score: Math.max(0, result.score),
    maxScore: Math.max(0, result.maxScore),
    percentage: Number.isFinite(result.percentage) ? result.percentage : 0,
    passPercentage: Number.isFinite(result.passPercentage)
      ? result.passPercentage
      : 0,
    passed: result.passed,
    resultLabel: result.passed ? "Pass" : "Below pass mark"
  };
}
