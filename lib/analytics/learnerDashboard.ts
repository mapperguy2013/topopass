import {
  buildReviewHistory,
  getReviewQuestionTypeLabel,
  getReviewSourceLabel,
  type ReviewHistoryItem
} from "../review/reviewHistory.ts";
import {
  getQuestionFamily,
  type QuestionFamily
} from "../questions/families.ts";
import type {
  NormalizedMockAttempt,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";

export type LearnerTopicPerformance = {
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number | null;
  enoughData: boolean;
  status: "strong" | "weak" | "developing";
};

export type LearnerRecentActivity = {
  id: string;
  date: string;
  title: string;
  sourceLabel: string;
  topic: string | null;
  scoreLabel: string;
  passed: boolean;
  href: string;
};

export type LearnerDashboardSummary = {
  totalQuestionsAttempted: number;
  correctAnswers: number;
  accuracy: number | null;
  mockExamsCompleted: number;
  topicPerformance: LearnerTopicPerformance[];
  strongTopics: LearnerTopicPerformance[];
  weakTopics: LearnerTopicPerformance[];
  recentActivity: LearnerRecentActivity[];
  guidance: string;
  familyBreakdown: Record<QuestionFamily, LearnerFamilySummary>;
};

export type LearnerFamilySummary = {
  family: QuestionFamily;
  label: string;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  accuracy: number | null;
  topicPerformance: LearnerTopicPerformance[];
  strongTopics: LearnerTopicPerformance[];
  weakTopics: LearnerTopicPerformance[];
};

type LearnerDashboardInput = {
  practiceAttempts?: NormalizedPracticeAttempt[];
  mockAttempts?: NormalizedMockAttempt[];
  minTopicAttempts?: number;
  recentLimit?: number;
};

function percent(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : null;
}

function scoreLabel(item: ReviewHistoryItem) {
  return typeof item.percentage === "number" ? `${item.percentage}%` : item.scoreLabel;
}

function topicStatus(accuracy: number | null, enoughData: boolean) {
  if (!enoughData || accuracy === null) return "developing" as const;
  if (accuracy >= 80) return "strong" as const;
  if (accuracy < 70) return "weak" as const;
  return "developing" as const;
}

function getTopicPerformance(
  items: ReviewHistoryItem[],
  minTopicAttempts: number
): LearnerTopicPerformance[] {
  const topics = new Map<string, { attempts: number; correct: number }>();

  items.forEach((item) => {
    if (!item.category) return;
    const current = topics.get(item.category) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;
    if (item.passed) current.correct += 1;
    topics.set(item.category, current);
  });

  return [...topics.entries()]
    .map(([topic, values]) => {
      const accuracy = percent(values.correct, values.attempts);
      const enoughData = values.attempts >= minTopicAttempts;

      return {
        topic,
        attempts: values.attempts,
        correct: values.correct,
        accuracy,
        enoughData,
        status: topicStatus(accuracy, enoughData)
      };
    })
    .sort((a, b) => {
      if (a.enoughData !== b.enoughData) return a.enoughData ? -1 : 1;
      return (a.accuracy ?? 101) - (b.accuracy ?? 101) || a.topic.localeCompare(b.topic);
    });
}

function getRecentActivity(
  items: ReviewHistoryItem[],
  recentLimit: number
): LearnerRecentActivity[] {
  return [...items]
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, recentLimit)
    .map((item) => ({
      id: item.id,
      date: item.answeredAt,
      title: item.title,
      sourceLabel: `${getReviewSourceLabel(item.source)} - ${getReviewQuestionTypeLabel(item.questionType)}`,
      topic: item.category,
      scoreLabel: scoreLabel(item),
      passed: item.passed,
      href: item.source === "mock" ? "/review?source=mock" : "/review?source=practice"
    }));
}

function familyForReviewItem(item: ReviewHistoryItem): QuestionFamily {
  return getQuestionFamily({
    category: item.category,
    id: item.questionId
  });
}

function getFamilySummary(
  family: QuestionFamily,
  label: string,
  reviewItems: ReviewHistoryItem[],
  minTopicAttempts: number
): LearnerFamilySummary {
  const items = reviewItems.filter((item) => familyForReviewItem(item) === family);
  const totalQuestionsAttempted = items.length;
  const correctAnswers = items.filter((item) => item.passed).length;
  const accuracy = percent(correctAnswers, totalQuestionsAttempted);
  const topicPerformance = getTopicPerformance(items, minTopicAttempts);

  return {
    family,
    label,
    totalQuestionsAttempted,
    correctAnswers,
    accuracy,
    topicPerformance,
    strongTopics: topicPerformance.filter((topic) => topic.status === "strong"),
    weakTopics: topicPerformance.filter((topic) => topic.status === "weak")
  };
}

function guidance({
  totalQuestionsAttempted,
  weakTopics,
  strongTopics,
  accuracy
}: {
  totalQuestionsAttempted: number;
  weakTopics: LearnerTopicPerformance[];
  strongTopics: LearnerTopicPerformance[];
  accuracy: number | null;
}) {
  if (totalQuestionsAttempted === 0) {
    return "Start with knowledge or map-click practice so TopoPass can build your progress picture.";
  }

  if (weakTopics.length > 0) {
    return `Focus next on ${weakTopics[0].topic}. It is currently your weakest measured topic.`;
  }

  if (strongTopics.length > 0 && typeof accuracy === "number" && accuracy >= 80) {
    return `Strongest topic: ${strongTopics[0].topic}. Use a mock exam to test mixed readiness.`;
  }

  if (strongTopics.length > 0) {
    return `Strongest topic: ${strongTopics[0].topic}. Keep rotating practice to build a wider base.`;
  }

  return "Complete a few more attempts per topic before treating percentages as reliable.";
}

export function buildLearnerDashboardSummary({
  practiceAttempts = [],
  mockAttempts = [],
  minTopicAttempts = 2,
  recentLimit = 8
}: LearnerDashboardInput = {}): LearnerDashboardSummary {
  const reviewItems = buildReviewHistory({ practiceAttempts, mockAttempts });
  const totalQuestionsAttempted = reviewItems.length;
  const correctAnswers = reviewItems.filter((item) => item.passed).length;
  const accuracy = percent(correctAnswers, totalQuestionsAttempted);
  const topicPerformance = getTopicPerformance(reviewItems, minTopicAttempts);
  const strongTopics = topicPerformance.filter((topic) => topic.status === "strong");
  const weakTopics = topicPerformance.filter((topic) => topic.status === "weak");

  return {
    totalQuestionsAttempted,
    correctAnswers,
    accuracy,
    mockExamsCompleted: mockAttempts.length,
    topicPerformance,
    strongTopics,
    weakTopics,
    recentActivity: getRecentActivity(reviewItems, recentLimit),
    familyBreakdown: {
      topographical: getFamilySummary(
        "topographical",
        "Topographical Skills",
        reviewItems,
        minTopicAttempts
      ),
      seru: getFamilySummary(
        "seru",
        "SERU Preparation",
        reviewItems,
        minTopicAttempts
      )
    },
    guidance: guidance({
      totalQuestionsAttempted,
      weakTopics,
      strongTopics,
      accuracy
    })
  };
}
