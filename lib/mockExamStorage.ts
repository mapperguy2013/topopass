import type { MockExamAnswers } from "./mockExamEngine.ts";
import type { MockExamModeId } from "./mockExamModes.ts";

export const ACTIVE_MOCK_EXAM_STORAGE_KEY = "topopass.mock-exam.active.v1";

export type StoredMockExamAttempt = {
  version: 1;
  attemptId?: string;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: MockExamAnswers;
  startedAt?: number;
  expiresAt: number;
  mode?: MockExamModeId;
};

export function loadActiveMockExam(): StoredMockExamAttempt | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(ACTIVE_MOCK_EXAM_STORAGE_KEY);
  if (!stored) return null;

  try {
    const attempt = JSON.parse(stored) as Partial<StoredMockExamAttempt>;
    if (
      attempt.version !== 1 ||
      !Array.isArray(attempt.questionIds) ||
      typeof attempt.currentQuestionIndex !== "number" ||
      !attempt.answers ||
      typeof attempt.expiresAt !== "number"
    ) {
      return null;
    }

    return attempt as StoredMockExamAttempt;
  } catch {
    return null;
  }
}

export function saveActiveMockExam(attempt: StoredMockExamAttempt) {
  window.localStorage.setItem(
    ACTIVE_MOCK_EXAM_STORAGE_KEY,
    JSON.stringify(attempt)
  );
}

export function clearActiveMockExam() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACTIVE_MOCK_EXAM_STORAGE_KEY);
  }
}
