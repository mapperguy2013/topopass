export type ScoreResult = {
  earned: number;
  possible: number;
  passed: boolean;
};

export function calculateScore(correctAnswers: number, totalQuestions: number) {
  const earned = Math.max(0, correctAnswers);
  const possible = Math.max(0, totalQuestions);
  const percentage = possible === 0 ? 0 : earned / possible;

  return {
    earned,
    possible,
    passed: percentage >= 0.7
  } satisfies ScoreResult;
}
