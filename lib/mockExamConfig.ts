export type MockExamQuestionCounts = {
  knowledge: number;
  "map-click": number;
  "route-drawing": number;
};

export type MockExamConfig = {
  durationMinutes: number;
  passPercentage: number;
  questionCounts: MockExamQuestionCounts;
};

export const DEFAULT_MOCK_EXAM_CONFIG: MockExamConfig = {
  durationMinutes: 30,
  passPercentage: 70,
  questionCounts: {
    knowledge: 3,
    "map-click": 3,
    "route-drawing": 2
  }
};

export function getMockExamQuestionTotal(config = DEFAULT_MOCK_EXAM_CONFIG) {
  return Object.values(config.questionCounts).reduce(
    (total, count) => total + count,
    0
  );
}
