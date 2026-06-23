export type MockExamTimerLevel =
  | "normal"
  | "five-minute-warning"
  | "one-minute-warning"
  | "expired";

export function getRemainingExamSeconds(
  expiresAt: number,
  now: number = Date.now()
) {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function getMockExamTimerLevel(
  remainingSeconds: number
): MockExamTimerLevel {
  if (remainingSeconds <= 0) return "expired";
  if (remainingSeconds <= 60) return "one-minute-warning";
  if (remainingSeconds <= 5 * 60) return "five-minute-warning";
  return "normal";
}

export function shouldAutoSubmitMockExam(expiresAt: number, now = Date.now()) {
  return getRemainingExamSeconds(expiresAt, now) === 0;
}

export function formatExamTime(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
