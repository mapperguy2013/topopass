import type { KnowledgeQuestionData } from "./knowledgeQuestions.ts";
import {
  advancedSentenceCompletionQuestions,
  scoreMultiSentenceCompletion,
  scoreSentenceCompletion,
  sentenceCompletionQuestions,
  type MultiSentenceCompletionQuestion,
  type SentenceCompletionQuestion
} from "./seruEnglishQuestions.ts";
import { phvHandbookQuestions } from "./seruPhvQuestions.ts";
import {
  scoreSeruReadingQuestion,
  SERU_READING_UNDERSTANDING_QUESTIONS,
  type SeruReadingQuestion
} from "./seruReadingQuestions.ts";

export type SeruMockQuestionType =
  | "seru_phv"
  | "seru_english_advanced"
  | "seru_english_single"
  | "seru_reading";

export type SeruMockQuestion =
  | {
      id: string;
      type: "seru_phv";
      label: "PHV Handbook";
      question: KnowledgeQuestionData;
    }
  | {
      id: string;
      type: "seru_english_advanced";
      label: "Advanced English";
      question: MultiSentenceCompletionQuestion;
    }
  | {
      id: string;
      type: "seru_english_single";
      label: "Complete the Sentence";
      question: SentenceCompletionQuestion;
    }
  | {
      id: string;
      type: "seru_reading";
      label: "Reading and Understanding";
      question: SeruReadingQuestion;
    };

export type SeruMockAnswer = string | Array<string | null> | null | undefined;

export type SeruMockQuestionScore = {
  questionId: string;
  type: SeruMockQuestionType;
  label: string;
  correct: boolean;
  score: number;
  maxScore: 1;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  category: string;
  topic?: string;
  handbookSection?: string;
  blankResults?: boolean[];
};

export type SeruMockResult = {
  totalQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  breakdown: Record<
    SeruMockQuestionType,
    {
      label: string;
      correct: number;
      total: number;
    }
  >;
  questionResults: SeruMockQuestionScore[];
};

export const SERU_MOCK_CONFIG = {
  passPercentage: 70,
  questionCounts: {
    seru_phv: 5,
    seru_english_advanced: 5,
    seru_english_single: 5,
    seru_reading: 5
  }
} as const;

export const SERU_MOCK_TYPE_LABELS = {
  seru_phv: "PHV Handbook",
  seru_english_advanced: "Advanced English",
  seru_english_single: "Complete the Sentence",
  seru_reading: "Reading and Understanding"
} as const satisfies Record<SeruMockQuestionType, string>;

const activePhvQuestions = phvHandbookQuestions.filter(
  (question) => question.isActive
);

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function selectFromBank<T>(
  bank: T[],
  count: number,
  label: string,
  random: () => number
) {
  if (bank.length < count) {
    throw new Error(
      `SERU mock needs ${count} ${label} questions but only ${bank.length} are available.`
    );
  }

  return shuffle(bank, random).slice(0, count);
}

export function buildSeruMockQuestions(random: () => number = Math.random) {
  const phvQuestions = selectFromBank(
    activePhvQuestions,
    SERU_MOCK_CONFIG.questionCounts.seru_phv,
    SERU_MOCK_TYPE_LABELS.seru_phv,
    random
  ).map(
    (question): SeruMockQuestion => ({
      id: question.id,
      type: "seru_phv",
      label: SERU_MOCK_TYPE_LABELS.seru_phv,
      question
    })
  );

  const advancedQuestions = selectFromBank(
    advancedSentenceCompletionQuestions,
    SERU_MOCK_CONFIG.questionCounts.seru_english_advanced,
    SERU_MOCK_TYPE_LABELS.seru_english_advanced,
    random
  ).map(
    (question): SeruMockQuestion => ({
      id: question.id,
      type: "seru_english_advanced",
      label: SERU_MOCK_TYPE_LABELS.seru_english_advanced,
      question
    })
  );

  const singleQuestions = selectFromBank(
    sentenceCompletionQuestions,
    SERU_MOCK_CONFIG.questionCounts.seru_english_single,
    SERU_MOCK_TYPE_LABELS.seru_english_single,
    random
  ).map(
    (question): SeruMockQuestion => ({
      id: question.id,
      type: "seru_english_single",
      label: SERU_MOCK_TYPE_LABELS.seru_english_single,
      question
    })
  );

  const readingQuestions = selectFromBank(
    SERU_READING_UNDERSTANDING_QUESTIONS,
    SERU_MOCK_CONFIG.questionCounts.seru_reading,
    SERU_MOCK_TYPE_LABELS.seru_reading,
    random
  ).map(
    (question): SeruMockQuestion => ({
      id: question.id,
      type: "seru_reading",
      label: SERU_MOCK_TYPE_LABELS.seru_reading,
      question
    })
  );

  return [
    ...phvQuestions,
    ...advancedQuestions,
    ...singleQuestions,
    ...readingQuestions
  ];
}

function answerText(answer: SeruMockAnswer) {
  if (Array.isArray(answer)) {
    return answer.map((value) => value ?? "Blank").join(" / ");
  }

  return answer ?? "No answer";
}

export function isSeruMockAnswerComplete(
  question: SeruMockQuestion,
  answer: SeruMockAnswer
) {
  if (question.type === "seru_english_advanced") {
    return (
      Array.isArray(answer) &&
      answer.length === 3 &&
      answer.every((value) => typeof value === "string" && value.length > 0)
    );
  }

  return typeof answer === "string" && answer.length > 0;
}

export function scoreSeruMockQuestion(
  question: SeruMockQuestion,
  answer: SeruMockAnswer
): SeruMockQuestionScore {
  if (question.type === "seru_phv") {
    const correct = answer === question.question.correctAnswer;
    return {
      questionId: question.id,
      type: question.type,
      label: question.label,
      correct,
      score: correct ? 1 : 0,
      maxScore: 1,
      userAnswer: answerText(answer),
      correctAnswer: question.question.correctAnswer,
      explanation: question.question.explanation ?? "",
      category: question.question.category,
      topic: question.question.topic,
      handbookSection: question.question.handbookSection
    };
  }

  if (question.type === "seru_english_advanced") {
    const selectedWords = Array.isArray(answer) ? answer : [];
    const result = scoreMultiSentenceCompletion(question.question, selectedWords);
    return {
      questionId: question.id,
      type: question.type,
      label: question.label,
      correct: result.correct,
      score: result.correct ? 1 : 0,
      maxScore: 1,
      userAnswer: answerText(selectedWords),
      correctAnswer: question.question.correctAnswers.join(" / "),
      explanation: question.question.explanation,
      category: question.question.category,
      blankResults: result.blankResults
    };
  }

  if (question.type === "seru_english_single") {
    const selectedAnswer = typeof answer === "string" ? answer : null;
    const correct = scoreSentenceCompletion(question.question, selectedAnswer);
    return {
      questionId: question.id,
      type: question.type,
      label: question.label,
      correct,
      score: correct ? 1 : 0,
      maxScore: 1,
      userAnswer: answerText(selectedAnswer),
      correctAnswer: question.question.correctAnswer,
      explanation: question.question.explanation,
      category: question.question.category
    };
  }

  const selectedAnswer = typeof answer === "string" ? answer : null;
  const correct = scoreSeruReadingQuestion(question.question, selectedAnswer);
  return {
    questionId: question.id,
    type: question.type,
    label: question.label,
    correct,
    score: correct ? 1 : 0,
    maxScore: 1,
    userAnswer: answerText(selectedAnswer),
    correctAnswer: question.question.correctAnswer,
    explanation: question.question.explanation,
    category: question.question.category,
    topic: question.question.topic,
    handbookSection: question.question.handbookSection
  };
}

export function scoreSeruMockAnswers(
  questions: SeruMockQuestion[],
  answers: Record<string, SeruMockAnswer>
): SeruMockResult {
  const questionResults = questions.map((question) =>
    scoreSeruMockQuestion(question, answers[question.id])
  );
  const score = questionResults.reduce((total, result) => total + result.score, 0);
  const maxScore = questionResults.reduce(
    (total, result) => total + result.maxScore,
    0
  );
  const percentage =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const breakdown = Object.fromEntries(
    (Object.keys(SERU_MOCK_TYPE_LABELS) as SeruMockQuestionType[]).map((type) => {
      const results = questionResults.filter((result) => result.type === type);
      return [
        type,
        {
          label: SERU_MOCK_TYPE_LABELS[type],
          correct: results.filter((result) => result.correct).length,
          total: results.length
        }
      ];
    })
  ) as SeruMockResult["breakdown"];

  return {
    totalQuestions: questions.length,
    score,
    maxScore,
    percentage,
    passed: percentage >= SERU_MOCK_CONFIG.passPercentage,
    breakdown,
    questionResults
  };
}
