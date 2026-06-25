import { DEFAULT_MOCK_EXAM_CONFIG, type MockExamConfig } from "./mockExamConfig.ts";
import {
  getProgressInsights,
  type ProgressInsightQuestionType
} from "./analytics/progressInsights.ts";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "./db/progressMigration.ts";
import {
  mockQuestionBank,
  selectMockExamQuestions,
  type MockExamQuestion,
  type MockQuestionType
} from "./mockTestQuestions.ts";
import type { MockExamModeId } from "./mockExamModes.ts";

export type BuildMockExamModeOptions = {
  mode: MockExamModeId;
  config?: MockExamConfig;
  random?: () => number;
  practiceAttempts?: unknown[];
  mockAttempts?: unknown[];
};

export type BuildMockExamModeResult = {
  mode: MockExamModeId;
  questions: MockExamQuestion[];
  fallbackMessage?: string;
  emptyStateReason?: string;
};

const routePracticeType = "route-drawing";
const mockQuestionTypeOrder: Record<MockQuestionType, number> = {
  knowledge: 0,
  "map-click": 1,
  "route-drawing": 2
};

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function totalQuestions(config: MockExamConfig) {
  return (
    config.questionCounts.knowledge +
    config.questionCounts["map-click"] +
    config.questionCounts["route-drawing"]
  );
}

function orderQuestionsByType(questions: MockExamQuestion[]) {
  return [...questions].sort(
    (a, b) => mockQuestionTypeOrder[a.type] - mockQuestionTypeOrder[b.type]
  );
}

function configForWeakType(
  weakType: ProgressInsightQuestionType,
  config: MockExamConfig
): MockExamConfig {
  const counts = { ...config.questionCounts };

  if (weakType === "knowledge") {
    counts.knowledge += 2;
    counts["map-click"] = Math.max(4, counts["map-click"] - 1);
    counts["route-drawing"] = Math.max(2, counts["route-drawing"] - 1);
  } else if (weakType === "map-click") {
    counts["map-click"] += 2;
    counts.knowledge = Math.max(8, counts.knowledge - 2);
  } else {
    counts["route-drawing"] += 2;
    counts.knowledge = Math.max(8, counts.knowledge - 1);
    counts["map-click"] = Math.max(4, counts["map-click"] - 1);
  }

  return {
    ...config,
    questionCounts: counts
  };
}

function normalizeFailedQuestionId(
  questionId: string,
  type: MockQuestionType | "route"
) {
  if (type === "knowledge") return questionId;
  if (type === "map-click") {
    return questionId.startsWith("mock-") ? questionId : `mock-${questionId}`;
  }

  if (questionId.startsWith("mock-route-")) return questionId;
  return `mock-route-${questionId}`;
}

function isFailedAttempt(passed: boolean | null, percentage: number | null) {
  if (typeof passed === "boolean") return !passed;
  return typeof percentage === "number" ? percentage < 70 : false;
}

function failedQuestionIdsFromPractice(attempts: NormalizedPracticeAttempt[]) {
  return attempts
    .filter((attempt) => isFailedAttempt(attempt.passed, attempt.percentage))
    .map((attempt) =>
      normalizeFailedQuestionId(attempt.questionId, attempt.questionType)
    );
}

function failedQuestionIdsFromMocks(attempts: NormalizedMockAttempt[]) {
  return attempts.flatMap((attempt) =>
    attempt.questionResults
      .filter((result) => !result.passed)
      .map((result) => normalizeFailedQuestionId(result.questionId, result.type))
  );
}

function questionsById() {
  return new Map(mockQuestionBank.map((question) => [question.id, question]));
}

function dedupeQuestions(questions: MockExamQuestion[]) {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function fillWithMixedQuestions({
  existingQuestions,
  config,
  random
}: {
  existingQuestions: MockExamQuestion[];
  config: MockExamConfig;
  random: () => number;
}) {
  const requiredTotal = totalQuestions(config);
  const selected = [...existingQuestions];
  const seen = new Set(selected.map((question) => question.id));
  const mixed = selectMockExamQuestions(config, random);

  mixed.forEach((question) => {
    if (selected.length >= requiredTotal) return;
    if (seen.has(question.id)) return;
    selected.push(question);
    seen.add(question.id);
  });

  if (selected.length < requiredTotal) {
    shuffled(mockQuestionBank, random).forEach((question) => {
      if (selected.length >= requiredTotal) return;
      if (seen.has(question.id)) return;
      selected.push(question);
      seen.add(question.id);
    });
  }

  return orderQuestionsByType(selected.slice(0, requiredTotal));
}

function buildStandardMock({
  mode,
  config,
  random
}: {
  mode: MockExamModeId;
  config: MockExamConfig;
  random: () => number;
}): BuildMockExamModeResult {
  return {
    mode,
    questions: selectMockExamQuestions(config, random)
  };
}

function buildWeakAreasMock({
  config,
  random,
  practiceAttempts,
  mockAttempts
}: Required<
  Pick<
    BuildMockExamModeOptions,
    "config" | "random" | "practiceAttempts" | "mockAttempts"
  >
>): BuildMockExamModeResult {
  const insights = getProgressInsights({ practiceAttempts, mockAttempts });

  if (
    insights.totalAttempts < 3 ||
    !insights.weakestType ||
    typeof insights.weakestType.averageScore !== "number"
  ) {
    return {
      mode: "weak-areas",
      questions: selectMockExamQuestions(config, random),
      fallbackMessage:
        "Weak Areas Mock needs more saved progress data. This attempt uses a standard mixed mock for now."
    };
  }

  const weakConfig = configForWeakType(insights.weakestType.type, config);
  return {
    mode: "weak-areas",
    questions: selectMockExamQuestions(weakConfig, random),
    fallbackMessage: `Prioritising ${insights.weakestType.label.toLowerCase()} questions based on saved progress.`
  };
}

function buildMistakesMock({
  config,
  random,
  practiceAttempts,
  mockAttempts
}: Required<
  Pick<
    BuildMockExamModeOptions,
    "config" | "random" | "practiceAttempts" | "mockAttempts"
  >
>): BuildMockExamModeResult {
  const normalizedPractice = normalizePracticeAttempts(practiceAttempts);
  const normalizedMocks = normalizeMockAttempts(mockAttempts);
  const availableQuestions = questionsById();
  const failedIds = [
    ...failedQuestionIdsFromPractice(normalizedPractice),
    ...failedQuestionIdsFromMocks(normalizedMocks)
  ];
  const failedQuestions = dedupeQuestions(
    failedIds
      .map((questionId) => availableQuestions.get(questionId))
      .filter((question): question is MockExamQuestion => Boolean(question))
  );

  if (failedQuestions.length === 0) {
    return {
      mode: "mistakes",
      questions: [],
      emptyStateReason:
        "No previous mistakes are saved yet. Complete practice or a mock exam first, then return to this mode."
    };
  }

  const requiredTotal = totalQuestions(config);
  const selectedFailedQuestions = shuffled(failedQuestions, random).slice(
    0,
    requiredTotal
  );

  if (selectedFailedQuestions.length >= requiredTotal) {
    return {
      mode: "mistakes",
      questions: orderQuestionsByType(selectedFailedQuestions)
    };
  }

  return {
    mode: "mistakes",
    questions: fillWithMixedQuestions({
      existingQuestions: selectedFailedQuestions,
      config,
      random
    }),
    fallbackMessage:
      "There were not enough saved mistakes for a full mock, so this attempt includes mixed questions as well."
  };
}

export function buildMockExamForMode({
  mode,
  config = DEFAULT_MOCK_EXAM_CONFIG,
  random = Math.random,
  practiceAttempts = [],
  mockAttempts = []
}: BuildMockExamModeOptions): BuildMockExamModeResult {
  if (mode === "practice" || mode === "exam-simulation") {
    return buildStandardMock({ mode, config, random });
  }

  if (mode === "weak-areas") {
    return buildWeakAreasMock({
      config,
      random,
      practiceAttempts,
      mockAttempts
    });
  }

  return buildMistakesMock({
    config,
    random,
    practiceAttempts,
    mockAttempts
  });
}

export function getMockQuestionTypePriorityForMode(mode: MockExamModeId) {
  if (mode === "mistakes") {
    return ["knowledge", "map-click", routePracticeType] as const;
  }

  return ["knowledge", "map-click", routePracticeType] as const;
}
