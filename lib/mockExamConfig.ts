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
    knowledge: 10,
    "map-click": 6,
    "route-drawing": 4
  }
};

export function getMockExamQuestionTotal(config = DEFAULT_MOCK_EXAM_CONFIG) {
  return Object.values(config.questionCounts).reduce(
    (total, count) => total + count,
    0
  );
}
