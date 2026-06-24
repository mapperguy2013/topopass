import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { demoMapClickQuestions } from "../mapClickQuestions.ts";
import {
  QUESTION_DIFFICULTIES,
  QUESTION_TOPICS,
  isAnyQuestionTopic,
  isQuestionTopic,
  type AnyQuestionTopic,
  type QuestionTopic
} from "../questions/topics.ts";
import {
  getActiveRouteQuestions,
  type RouteQuestion
} from "../../src/data/routeQuestions.ts";

export type PracticeQuestionType = "knowledge" | "map-click" | "route-drawing";
export type PracticeDifficulty = (typeof QUESTION_DIFFICULTIES)[number];
export type PracticeDifficultyFilter = PracticeDifficulty | "all";

export type PracticeQuestionFilter = {
  topic: AnyQuestionTopic | "all";
  difficulty: PracticeDifficultyFilter;
};

export type PracticeTopicStat = {
  topic: QuestionTopic;
  total: number;
  knowledge: number;
  mapClick: number;
  routeDrawing: number;
};

export type PracticeSessionResult = {
  questionId: string;
  prompt: string;
  questionType: PracticeQuestionType;
  topic: string;
  difficulty: PracticeDifficulty;
  passed: boolean;
  percentage: number;
  learnerAnswer: string;
  correctAnswer: string;
  feedback?: string | null;
};

export type PracticeSessionSummary = {
  answered: number;
  correct: number;
  incorrect: number;
  percentage: number;
  topicBreakdown: Array<{
    topic: string;
    answered: number;
    correct: number;
    percentage: number;
  }>;
  weakTopics: string[];
  wrongAnswers: PracticeSessionResult[];
  recommendation: string;
};

function normalizeDifficulty(value: unknown): PracticeDifficultyFilter {
  return QUESTION_DIFFICULTIES.includes(value as PracticeDifficulty)
    ? (value as PracticeDifficulty)
    : "all";
}

export function normalizePracticeQuestionFilter(
  topic: unknown,
  difficulty: unknown
): PracticeQuestionFilter {
  return {
    topic: isAnyQuestionTopic(topic) ? topic : "all",
    difficulty: normalizeDifficulty(difficulty)
  };
}

export function topicHref(
  baseHref: string,
  filter: Partial<PracticeQuestionFilter>
) {
  const params = new URLSearchParams();
  if (filter.topic && filter.topic !== "all") params.set("topic", filter.topic);
  if (filter.difficulty && filter.difficulty !== "all") {
    params.set("difficulty", filter.difficulty);
  }
  const query = params.toString();
  return query ? `${baseHref}?${query}` : baseHref;
}

function incrementTopic(
  stats: Map<QuestionTopic, PracticeTopicStat>,
  topic: QuestionTopic,
  type: PracticeQuestionType
) {
  const current =
    stats.get(topic) ??
    ({
      topic,
      total: 0,
      knowledge: 0,
      mapClick: 0,
      routeDrawing: 0
    } satisfies PracticeTopicStat);

  current.total += 1;
  if (type === "knowledge") current.knowledge += 1;
  if (type === "map-click") current.mapClick += 1;
  if (type === "route-drawing") current.routeDrawing += 1;
  stats.set(topic, current);
}

export function getPracticeTopicStats(): PracticeTopicStat[] {
  const stats = new Map<QuestionTopic, PracticeTopicStat>();

  QUESTION_TOPICS.forEach((topic) =>
    stats.set(topic, {
      topic,
      total: 0,
      knowledge: 0,
      mapClick: 0,
      routeDrawing: 0
    })
  );

  knowledgeQuestionBank
    .filter((question) => question.isActive && isQuestionTopic(question.category))
    .forEach((question) =>
      incrementTopic(stats, question.category as QuestionTopic, "knowledge")
    );

  demoMapClickQuestions
    .filter((question) => question.isActive && isQuestionTopic(question.category))
    .forEach((question) =>
      incrementTopic(stats, question.category as QuestionTopic, "map-click")
    );

  getActiveRouteQuestions().forEach((question) => {
    question.tags
      .filter(isQuestionTopic)
      .forEach((topic) => incrementTopic(stats, topic, "route-drawing"));
  });

  return [...stats.values()].sort((a, b) => b.total - a.total || a.topic.localeCompare(b.topic));
}

export function filterByPracticeFilter<
  T extends {
    difficulty: PracticeDifficulty;
    category?: string;
    tags?: string[];
  }
>(questions: T[], filter: PracticeQuestionFilter) {
  return questions.filter((question) => {
    if (filter.difficulty !== "all" && question.difficulty !== filter.difficulty) {
      return false;
    }

    if (filter.topic === "all") return true;
    if (question.category === filter.topic) return true;
    return question.tags?.includes(filter.topic) ?? false;
  });
}

export function routeQuestionTopic(question: RouteQuestion) {
  return question.tags.find(isQuestionTopic) ?? "Route planning";
}

export function upsertPracticeSessionResult(
  results: PracticeSessionResult[],
  nextResult: PracticeSessionResult
) {
  return [
    ...results.filter((result) => result.questionId !== nextResult.questionId),
    nextResult
  ];
}

function topicRecommendation(summary: {
  weakTopics: string[];
  incorrect: number;
  answered: number;
  percentage: number;
}) {
  if (summary.answered === 0) {
    return "Answer a few questions to get a useful practice recommendation.";
  }
  if (summary.weakTopics.length > 0) {
    return `Review ${summary.weakTopics[0]} next, then retry the questions you missed.`;
  }
  if (summary.percentage >= 80) {
    return "This was a strong session. Use a mixed mock exam to check exam readiness.";
  }
  if (summary.incorrect > 0) {
    return "Review the missed answers below before moving to a harder filter.";
  }
  return "Keep rotating topics so the session stays exam-relevant.";
}

export function buildPracticeSessionSummary(
  results: PracticeSessionResult[]
): PracticeSessionSummary {
  const answered = results.length;
  const correct = results.filter((result) => result.passed).length;
  const incorrect = answered - correct;
  const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const topicMap = new Map<string, { answered: number; correct: number }>();

  results.forEach((result) => {
    const current = topicMap.get(result.topic) ?? { answered: 0, correct: 0 };
    current.answered += 1;
    if (result.passed) current.correct += 1;
    topicMap.set(result.topic, current);
  });

  const topicBreakdown = [...topicMap.entries()]
    .map(([topic, value]) => ({
      topic,
      answered: value.answered,
      correct: value.correct,
      percentage:
        value.answered > 0 ? Math.round((value.correct / value.answered) * 100) : 0
    }))
    .sort((a, b) => a.percentage - b.percentage || a.topic.localeCompare(b.topic));
  const weakTopics = topicBreakdown
    .filter((topic) => topic.percentage < 70)
    .map((topic) => topic.topic);
  const wrongAnswers = results.filter((result) => !result.passed);

  return {
    answered,
    correct,
    incorrect,
    percentage,
    topicBreakdown,
    weakTopics,
    wrongAnswers,
    recommendation: topicRecommendation({
      answered,
      incorrect,
      percentage,
      weakTopics
    })
  };
}
