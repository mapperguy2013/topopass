export type MockExamModeId =
  | "practice"
  | "exam-simulation"
  | "weak-areas"
  | "mistakes";

export type MockExamModeMetadata = {
  id: MockExamModeId;
  label: string;
  description: string;
  resultSummary: string;
  timed: boolean;
  examStyle: boolean;
  hideFeedbackUntilSubmission: boolean;
};

export const MOCK_EXAM_MODES: Record<MockExamModeId, MockExamModeMetadata> = {
  practice: {
    id: "practice",
    label: "Practice Mock",
    description: "A standard mixed mock with full review after completion.",
    resultSummary: "This was a standard mixed practice mock.",
    timed: true,
    examStyle: false,
    hideFeedbackUntilSubmission: true
  },
  "exam-simulation": {
    id: "exam-simulation",
    label: "Exam Simulation",
    description: "A timed exam-style mock with feedback only after submission.",
    resultSummary: "Completed under exam-style conditions with feedback held until submission.",
    timed: true,
    examStyle: true,
    hideFeedbackUntilSubmission: true
  },
  "weak-areas": {
    id: "weak-areas",
    label: "Weak Areas Mock",
    description:
      "Focuses on the question types your recent results suggest need more work.",
    resultSummary: "This mock focused on question types where recent results were weaker.",
    timed: true,
    examStyle: false,
    hideFeedbackUntilSubmission: true
  },
  mistakes: {
    id: "mistakes",
    label: "Mistakes Mock",
    description:
      "Rebuilds a mock from questions you have previously answered incorrectly.",
    resultSummary: "This mock focused on questions previously answered incorrectly.",
    timed: true,
    examStyle: false,
    hideFeedbackUntilSubmission: true
  }
};

export function getMockExamModeMetadata(mode: MockExamModeId) {
  return MOCK_EXAM_MODES[mode];
}

export function isMockExamModeId(value: unknown): value is MockExamModeId {
  return (
    value === "practice" ||
    value === "exam-simulation" ||
    value === "weak-areas" ||
    value === "mistakes"
  );
}

export function normalizeMockExamMode(value: unknown): MockExamModeId {
  if (value === "exam") return "exam-simulation";
  return isMockExamModeId(value) ? value : "practice";
}
