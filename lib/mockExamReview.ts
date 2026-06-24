import type {
  MockExamResult,
  MockQuestionScoreResult
} from "./mockExamEngine.ts";
import type { MockExamQuestion, MockQuestionType } from "./mockTestQuestions.ts";

export type MockExamTopicBreakdown = {
  topic: string;
  total: number;
  answered: number;
  passed: number;
  score: number;
  maxScore: number;
  percentage: number;
};

export type MockExamReviewItem = {
  questionId: string;
  prompt: string;
  questionNumber: number;
  type: MockQuestionType;
  topic: string;
  difficulty: string;
  learnerAnswer: string;
  acceptedAnswer: string;
  passed: boolean;
  answered: boolean;
  scoreLabel: string;
  percentage: number;
  explanation?: string | null;
};

function topicForQuestion(question: MockExamQuestion | undefined) {
  if (!question) return "Mixed questions";
  if (question.type === "route-drawing") {
    return question.routeQuestion.tags[0] ?? question.category ?? "Route planning";
  }
  return question.category ?? "Mixed questions";
}

function difficultyForQuestion(question: MockExamQuestion | undefined) {
  return question?.difficulty ?? "mixed";
}

function explanationForResult(
  question: MockExamQuestion | undefined,
  result: MockQuestionScoreResult
) {
  if (result.details.type === "route-drawing") {
    return (
      result.details.explanation ??
      (question?.type === "route-drawing"
        ? question.routeQuestion.explanation
        : question?.explanation) ??
      null
    );
  }

  return result.details.explanation ?? question?.explanation ?? null;
}

function emptyTopic(): MockExamTopicBreakdown {
  return {
    topic: "",
    total: 0,
    answered: 0,
    passed: 0,
    score: 0,
    maxScore: 0,
    percentage: 0
  };
}

export function getMockExamTopicBreakdown(
  questions: MockExamQuestion[],
  result: MockExamResult
): MockExamTopicBreakdown[] {
  const topics = new Map<string, MockExamTopicBreakdown>();

  result.questionResults.forEach((questionResult, index) => {
    const topic = topicForQuestion(questions[index]);
    const current = topics.get(topic) ?? { ...emptyTopic(), topic };
    current.total += 1;
    current.answered += questionResult.answered ? 1 : 0;
    current.passed += questionResult.passed ? 1 : 0;
    current.score += questionResult.score;
    current.maxScore += questionResult.maxScore;
    current.percentage =
      current.maxScore > 0
        ? Math.round((current.score / current.maxScore) * 100)
        : 0;
    topics.set(topic, current);
  });

  return [...topics.values()].sort(
    (a, b) => a.percentage - b.percentage || a.topic.localeCompare(b.topic)
  );
}

export function getMockExamNextStep(
  result: MockExamResult,
  topicBreakdown: MockExamTopicBreakdown[] = []
) {
  const weakestTopic = topicBreakdown.find((topic) => topic.percentage < 70);

  if (!result.passed && weakestTopic) {
    return `Review ${weakestTopic.topic} first, then retry those question types before another mock.`;
  }

  if (!result.passed) {
    return "Review every missed answer, then complete a short focused practice session before retrying.";
  }

  if (weakestTopic) {
    return `You passed overall, but ${weakestTopic.topic} still needs attention.`;
  }

  return "This was a pass-level result. Keep reviewing explanations and use mixed mocks to maintain readiness.";
}

export function formatMockExamReviewItems(
  questions: MockExamQuestion[],
  result: MockExamResult
): MockExamReviewItem[] {
  return result.questionResults.map((questionResult, index) => {
    const question = questions[index];

    return {
      questionId: questionResult.questionId,
      prompt: question?.prompt ?? questionResult.questionId,
      questionNumber: index + 1,
      type: questionResult.type,
      topic: topicForQuestion(question),
      difficulty: difficultyForQuestion(question),
      learnerAnswer: questionResult.userAnswerSummary,
      acceptedAnswer: questionResult.acceptedAnswerSummary,
      passed: questionResult.passed,
      answered: questionResult.answered,
      scoreLabel: `${questionResult.score}/${questionResult.maxScore}`,
      percentage: questionResult.percentage,
      explanation: explanationForResult(question, questionResult)
    };
  });
}
