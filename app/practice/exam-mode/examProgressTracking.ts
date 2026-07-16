import type {
  ExamScoringAssessment,
  ExamScoringCategoryId,
  ExamScoringCategoryOutcome,
  ExamScoringCategoryResult,
  ExamScoringResult
} from "./examScoringRubric.ts";
import { EXAM_ROUTE_TAGS, type ExamRouteTag } from "./examRoutePack.ts";

export const EXAM_PROGRESS_SCHEMA_VERSION = 1;
export const EXAM_PROGRESS_STORAGE_KEY = "topopass.examProgress.v1";
export const EXAM_PROGRESS_MAX_ATTEMPTS = 50;
export const EXAM_PROGRESS_RECENT_ATTEMPT_LIMIT = 5;

export type ExamProgressAttemptRecord = {
  schemaVersion: typeof EXAM_PROGRESS_SCHEMA_VERSION;
  id: string;
  taskId: string;
  taskTitle: string;
  mapId: string;
  taskVersion: string | null;
  originLabel: string;
  destinationLabel: string;
  completedAt: string;
  elapsedSeconds: number;
  completionState: "submitted";
  scorePercent: number;
  status: ExamScoringResult["status"];
  statusLabel: ExamScoringResult["statusLabel"];
  categories: ExamScoringCategoryResult[];
  routeTags: ExamRouteTag[];
};

export type ExamProgressState = {
  schemaVersion: typeof EXAM_PROGRESS_SCHEMA_VERSION;
  attempts: ExamProgressAttemptRecord[];
};

export type BuildCompletedExamProgressAttemptInput = {
  mode: "dev" | "student-beta" | "student-exam";
  submitted: boolean;
  attemptId: string;
  taskId: string;
  taskTitle: string;
  mapId: string;
  taskVersion?: string | number | null;
  originLabel: string;
  destinationLabel: string;
  completedAt: string;
  elapsedSeconds: number;
  scoringResult: ExamScoringResult | null;
  routeTags?: readonly ExamRouteTag[];
};

export type ExamProgressWeakCategory = {
  id: ExamScoringCategoryId;
  label: string;
  needsPracticeCount: number;
  latestSummary: string;
};

export type ExamProgressRouteTagFocus = {
  tag: ExamRouteTag;
  attemptCount: number;
  needsPracticeAttemptCount: number;
};

export type ExamProgressTrend = {
  direction: "improving" | "declining" | "steady" | "insufficient-data";
  changePercent: number | null;
};

export type ExamProgressSummary = {
  attemptCount: number;
  recentAttempts: ExamProgressAttemptRecord[];
  latestAttempt: ExamProgressAttemptRecord | null;
  bestAttempt: ExamProgressAttemptRecord | null;
  latestScorePercent: number | null;
  bestScorePercent: number | null;
  averageScorePercent: number | null;
  trend: ExamProgressTrend;
  repeatedWeakCategories: ExamProgressWeakCategory[];
  routeTagsNeedingPractice: ExamProgressRouteTagFocus[];
};

export type ExamProgressStorageAdapter = {
  load: () => ExamProgressStorageLoadResult;
  save: (progress: ExamProgressState) => ExamProgressStorageWriteResult;
  clear: () => ExamProgressStorageWriteResult;
};

export type ExamProgressStorageLoadResult = {
  ok: boolean;
  source: "local" | "unavailable";
  progress: ExamProgressState;
  reason?: string;
  error?: string;
};

export type ExamProgressStorageWriteResult = {
  ok: boolean;
  source: "local" | "unavailable";
  reason?: string;
  error?: string;
};

type ExamProgressStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const CATEGORY_IDS: readonly ExamScoringCategoryId[] = [
  "legality",
  "destination-completion",
  "route-efficiency",
  "detour-backtracking",
  "road-suitability",
  "avoidable-mistakes"
];
const CATEGORY_ASSESSMENTS: readonly ExamScoringAssessment[] = ["supported", "limited", "unavailable"];
const CATEGORY_OUTCOMES: readonly ExamScoringCategoryOutcome[] = [
  "met",
  "needs-practice",
  "limited",
  "unavailable"
];
const ROUTE_TAG_SET = new Set<string>(EXAM_ROUTE_TAGS);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(new Date(value).getTime());
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function stringVersion(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return nonEmptyString(value);
}

function cloneCategory(category: ExamScoringCategoryResult): ExamScoringCategoryResult {
  return {
    ...category,
    evidence: [...category.evidence]
  };
}

function normaliseCategory(value: unknown): ExamScoringCategoryResult | null {
  if (!isObject(value)) {
    return null;
  }

  const id = CATEGORY_IDS.find((candidate) => candidate === value.id);
  const label = nonEmptyString(value.label);
  const assessment = CATEGORY_ASSESSMENTS.find((candidate) => candidate === value.assessment);
  const outcome = CATEGORY_OUTCOMES.find((candidate) => candidate === value.outcome);
  const summary = nonEmptyString(value.summary);
  const scorePercent = value.scorePercent === null || isFiniteNumber(value.scorePercent)
    ? value.scorePercent
    : null;
  const scoreIsValid = scorePercent === null || (scorePercent >= 0 && scorePercent <= 100);

  if (
    !id ||
    !label ||
    !assessment ||
    !outcome ||
    !summary ||
    !scoreIsValid ||
    !isFiniteNumber(value.weightPercent) ||
    value.weightPercent < 0 ||
    value.weightPercent > 100 ||
    !isFiniteNumber(value.weightedPoints) ||
    value.weightedPoints < 0 ||
    value.weightedPoints > value.weightPercent
  ) {
    return null;
  }

  return {
    id,
    label,
    assessment,
    outcome,
    scorePercent,
    weightPercent: value.weightPercent,
    weightedPoints: value.weightedPoints,
    summary,
    evidence: Array.isArray(value.evidence)
      ? value.evidence.filter((item): item is string => typeof item === "string")
      : []
  };
}

function normaliseRouteTags(value: unknown): ExamRouteTag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((tag): tag is ExamRouteTag => typeof tag === "string" && ROUTE_TAG_SET.has(tag)))];
}

function normaliseAttempt(value: unknown): ExamProgressAttemptRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const id = nonEmptyString(value.id);
  const taskId = nonEmptyString(value.taskId);
  const taskTitle = nonEmptyString(value.taskTitle);
  const mapId = nonEmptyString(value.mapId);
  const originLabel = nonEmptyString(value.originLabel);
  const destinationLabel = nonEmptyString(value.destinationLabel);
  const categories = Array.isArray(value.categories)
    ? value.categories.map(normaliseCategory).filter((category): category is ExamScoringCategoryResult => Boolean(category))
    : [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const status = value.status === "pass" || value.status === "needs-practice" ? value.status : null;

  if (
    !id ||
    !taskId ||
    !taskTitle ||
    !mapId ||
    !originLabel ||
    !destinationLabel ||
    !isValidIsoTimestamp(value.completedAt) ||
    !isFiniteNumber(value.elapsedSeconds) ||
    value.elapsedSeconds < 0 ||
    value.completionState !== "submitted" ||
    !isFiniteNumber(value.scorePercent) ||
    value.scorePercent < 0 ||
    value.scorePercent > 100 ||
    !status ||
    categories.length !== CATEGORY_IDS.length ||
    categoryIds.size !== CATEGORY_IDS.length
  ) {
    return null;
  }

  return {
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    id,
    taskId,
    taskTitle,
    mapId,
    taskVersion: stringVersion(value.taskVersion),
    originLabel,
    destinationLabel,
    completedAt: value.completedAt,
    elapsedSeconds: Math.floor(value.elapsedSeconds),
    completionState: "submitted",
    scorePercent: roundToOneDecimal(value.scorePercent),
    status,
    statusLabel: status === "pass" ? "Pass" : "Needs practice",
    categories,
    routeTags: normaliseRouteTags(value.routeTags)
  };
}

function attemptTimestamp(attempt: ExamProgressAttemptRecord): number {
  return new Date(attempt.completedAt).getTime();
}

function sortAndLimitAttempts(attempts: readonly ExamProgressAttemptRecord[]): ExamProgressAttemptRecord[] {
  const seenIds = new Set<string>();

  return [...attempts]
    .sort((left, right) => attemptTimestamp(right) - attemptTimestamp(left))
    .filter((attempt) => {
      if (seenIds.has(attempt.id)) {
        return false;
      }

      seenIds.add(attempt.id);
      return true;
    })
    .slice(0, EXAM_PROGRESS_MAX_ATTEMPTS);
}

function resolveStore(input: { storage?: ExamProgressStore | null }): ExamProgressStore | null {
  if (Object.prototype.hasOwnProperty.call(input, "storage")) {
    return input.storage ?? null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createEmptyExamProgressState(): ExamProgressState {
  return {
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    attempts: []
  };
}

export function buildCompletedExamProgressAttempt(
  input: BuildCompletedExamProgressAttemptInput
): ExamProgressAttemptRecord | null {
  if (input.mode !== "student-exam" || !input.submitted || !input.scoringResult) {
    return null;
  }

  const attempt = normaliseAttempt({
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    id: input.attemptId,
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    mapId: input.mapId,
    taskVersion: input.taskVersion,
    originLabel: input.originLabel,
    destinationLabel: input.destinationLabel,
    completedAt: input.completedAt,
    elapsedSeconds: input.elapsedSeconds,
    completionState: "submitted",
    scorePercent: input.scoringResult.scorePercent,
    status: input.scoringResult.status,
    statusLabel: input.scoringResult.statusLabel,
    categories: input.scoringResult.categories.map(cloneCategory),
    routeTags: input.routeTags ?? []
  });

  return attempt;
}

export function normaliseExamProgressState(value: unknown): ExamProgressState {
  if (!isObject(value) || !Array.isArray(value.attempts)) {
    return createEmptyExamProgressState();
  }

  const attempts = value.attempts
    .map(normaliseAttempt)
    .filter((attempt): attempt is ExamProgressAttemptRecord => Boolean(attempt));

  return {
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    attempts: sortAndLimitAttempts(attempts)
  };
}

export function recordExamProgressAttempt(
  progress: ExamProgressState,
  attempt: ExamProgressAttemptRecord
): ExamProgressState {
  return normaliseExamProgressState({
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    attempts: [attempt, ...progress.attempts.filter((candidate) => candidate.id !== attempt.id)]
  });
}

export function buildExamProgressSummary(progress: ExamProgressState): ExamProgressSummary {
  const attempts = sortAndLimitAttempts(progress.attempts);
  const latestAttempt = attempts[0] ?? null;
  const previousAttempt = attempts[1] ?? null;
  const bestAttempt = attempts.reduce<ExamProgressAttemptRecord | null>(
    (best, attempt) => (!best || attempt.scorePercent > best.scorePercent ? attempt : best),
    null
  );
  const averageScorePercent = attempts.length > 0
    ? roundToOneDecimal(attempts.reduce((total, attempt) => total + attempt.scorePercent, 0) / attempts.length)
    : null;
  const trendChange = latestAttempt && previousAttempt
    ? roundToOneDecimal(latestAttempt.scorePercent - previousAttempt.scorePercent)
    : null;
  const weakCategories = new Map<ExamScoringCategoryId, ExamProgressWeakCategory>();
  const tagCounts = new Map<ExamRouteTag, ExamProgressRouteTagFocus>();

  for (const attempt of attempts) {
    for (const category of attempt.categories) {
      if (category.outcome !== "needs-practice") {
        continue;
      }

      const current = weakCategories.get(category.id);
      weakCategories.set(category.id, {
        id: category.id,
        label: category.label,
        needsPracticeCount: (current?.needsPracticeCount ?? 0) + 1,
        latestSummary: current?.latestSummary ?? category.summary
      });
    }

    for (const tag of attempt.routeTags) {
      const current = tagCounts.get(tag);
      tagCounts.set(tag, {
        tag,
        attemptCount: (current?.attemptCount ?? 0) + 1,
        needsPracticeAttemptCount:
          (current?.needsPracticeAttemptCount ?? 0) + (attempt.status === "needs-practice" ? 1 : 0)
      });
    }
  }

  return {
    attemptCount: attempts.length,
    recentAttempts: attempts.slice(0, EXAM_PROGRESS_RECENT_ATTEMPT_LIMIT),
    latestAttempt,
    bestAttempt,
    latestScorePercent: latestAttempt?.scorePercent ?? null,
    bestScorePercent: bestAttempt?.scorePercent ?? null,
    averageScorePercent,
    trend: {
      direction:
        trendChange === null
          ? "insufficient-data"
          : trendChange > 0
            ? "improving"
            : trendChange < 0
              ? "declining"
              : "steady",
      changePercent: trendChange
    },
    repeatedWeakCategories: [...weakCategories.values()]
      .filter((category) => category.needsPracticeCount >= 2)
      .sort(
        (left, right) =>
          right.needsPracticeCount - left.needsPracticeCount || left.label.localeCompare(right.label)
      ),
    routeTagsNeedingPractice: [...tagCounts.values()]
      .filter((tag) => tag.needsPracticeAttemptCount > 0)
      .sort(
        (left, right) =>
          right.needsPracticeAttemptCount - left.needsPracticeAttemptCount ||
          right.attemptCount - left.attemptCount ||
          left.tag.localeCompare(right.tag)
      )
  };
}

export function formatExamProgressDate(completedAt: string): string {
  const date = new Date(completedAt);

  if (!Number.isFinite(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function createLocalExamProgressStorage(input: {
  storage?: ExamProgressStore | null;
  key?: string;
} = {}): ExamProgressStorageAdapter {
  const key = input.key ?? EXAM_PROGRESS_STORAGE_KEY;

  return {
    load() {
      const store = resolveStore(input);

      if (!store) {
        return {
          ok: false,
          source: "unavailable",
          progress: createEmptyExamProgressState(),
          reason: "Browser localStorage is unavailable, so exam progress is available only for this session."
        };
      }

      try {
        const rawValue = store.getItem(key);

        if (!rawValue) {
          return {
            ok: true,
            source: "local",
            progress: createEmptyExamProgressState(),
            reason: "No completed exam attempts are saved on this device yet."
          };
        }

        return {
          ok: true,
          source: "local",
          progress: normaliseExamProgressState(JSON.parse(rawValue))
        };
      } catch (error) {
        return {
          ok: false,
          source: "local",
          progress: createEmptyExamProgressState(),
          reason: "Saved exam progress could not be read, so a fresh local progress state was used.",
          error: error instanceof Error ? error.message : "Unknown exam progress read failure."
        };
      }
    },
    save(progress) {
      const store = resolveStore(input);

      if (!store) {
        return {
          ok: false,
          source: "unavailable",
          reason: "Browser localStorage is unavailable, so this exam attempt was not saved after the session."
        };
      }

      try {
        store.setItem(key, JSON.stringify(normaliseExamProgressState(progress)));

        return {
          ok: true,
          source: "local"
        };
      } catch (error) {
        return {
          ok: false,
          source: "local",
          reason: "Exam progress could not be saved in this browser.",
          error: error instanceof Error ? error.message : "Unknown exam progress write failure."
        };
      }
    },
    clear() {
      const store = resolveStore(input);

      if (!store) {
        return {
          ok: false,
          source: "unavailable",
          reason: "Browser localStorage is unavailable, so there was no saved exam progress to clear."
        };
      }

      try {
        store.removeItem(key);

        return {
          ok: true,
          source: "local"
        };
      } catch (error) {
        return {
          ok: false,
          source: "local",
          reason: "Saved exam progress could not be cleared in this browser.",
          error: error instanceof Error ? error.message : "Unknown exam progress clear failure."
        };
      }
    }
  };
}
