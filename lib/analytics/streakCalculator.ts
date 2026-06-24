import {
  normalizeMockAttempts,
  normalizePracticeAttempts
} from "../db/progressMigration.ts";

export type LearningStreak = {
  current: number;
  longest: number;
};

function dateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function calculateLearningStreak(
  practiceAttempts: unknown[],
  mockAttempts: unknown[],
  referenceDate = new Date()
): LearningStreak {
  const days = new Set<string>();

  normalizePracticeAttempts(practiceAttempts).forEach((attempt) => {
    const key = dateKey(attempt.createdAt);
    if (key) days.add(key);
  });

  normalizeMockAttempts(mockAttempts).forEach((attempt) => {
    const key = dateKey(attempt.submittedAt);
    if (key) days.add(key);
  });

  if (days.size === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDays = [...days].sort();
  let longest = 1;
  let running = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = new Date(`${sortedDays[index - 1]}T00:00:00.000Z`);
    const current = new Date(`${sortedDays[index]}T00:00:00.000Z`);
    const differenceDays = Math.round(
      (current.getTime() - previous.getTime()) / 86_400_000
    );

    running = differenceDays === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
  }

  let current = 0;
  let cursor = new Date(
    `${referenceDate.toISOString().slice(0, 10)}T00:00:00.000Z`
  );

  while (days.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest };
}
