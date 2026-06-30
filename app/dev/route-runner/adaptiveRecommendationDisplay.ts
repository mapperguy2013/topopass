import type {
  AdaptivePracticeExercise,
  AdaptivePracticeExerciseDifficulty,
  AdaptivePracticeQueueItem,
  AdaptivePracticeQueuePriority
} from "./adaptivePracticeQueue";
import type { AdaptivePracticeLauncherItemStatus } from "./adaptivePracticeLauncher";

export interface CompactAdaptiveRecommendationRow {
  id: string;
  number: number;
  title: string;
  summary: string;
  weakAreaLabel: string;
  priority: AdaptivePracticeQueuePriority;
  status: AdaptivePracticeLauncherItemStatus;
  difficulty: AdaptivePracticeExerciseDifficulty | null;
  linkedExerciseLabel: string;
  isSelected: boolean;
}

export interface CompactAdaptiveRecommendationDetail {
  id: string;
  title: string;
  explanation: string;
  practiceFocus: string;
  weakAreaLabel: string;
  priority: AdaptivePracticeQueuePriority;
  status: AdaptivePracticeLauncherItemStatus;
  score: number;
  difficulty: AdaptivePracticeExerciseDifficulty | null;
  linkedExerciseId: string | null;
  linkedExerciseLabel: string;
  signalLabel: string;
  reasons: string[];
}

export interface CompactAdaptiveRecommendationDisplayModel {
  selectedId: string | null;
  selectedItem: AdaptivePracticeQueueItem | null;
  rows: CompactAdaptiveRecommendationRow[];
  detail: CompactAdaptiveRecommendationDetail | null;
}

export interface BuildCompactAdaptiveRecommendationDisplayInput {
  items: readonly AdaptivePracticeQueueItem[];
  selectedItemId?: string | null;
  availableExercises?: readonly AdaptivePracticeExercise[];
  itemStatuses?: Readonly<Record<string, AdaptivePracticeLauncherItemStatus>>;
}

function labelFromSlugs(values: readonly string[], fallback: string): string {
  return values.length > 0 ? values.map((value) => value.replaceAll("-", " ")).join(", ") : fallback;
}

function findLinkedExercise(
  item: AdaptivePracticeQueueItem,
  availableExercises: readonly AdaptivePracticeExercise[]
): AdaptivePracticeExercise | null {
  for (const exerciseId of item.relatedExerciseIds) {
    const exercise = availableExercises.find((candidate) => candidate.id === exerciseId);

    if (exercise) {
      return exercise;
    }
  }

  return null;
}

function linkedExerciseLabel(item: AdaptivePracticeQueueItem, linkedExercise: AdaptivePracticeExercise | null): string {
  if (linkedExercise) {
    return `${linkedExercise.title} (${linkedExercise.id})`;
  }

  return item.relatedExerciseIds[0] ?? "No linked exercise yet";
}

function sourceSignalLabel(item: AdaptivePracticeQueueItem): string {
  const signals: string[] = [];

  if (item.sourceSignals.latestReview) {
    signals.push("latest review");
  }

  if (item.sourceSignals.weakAreaProfile) {
    signals.push("weak-area profile");
  }

  if (item.sourceSignals.attemptHistory) {
    signals.push("attempt history");
  }

  if (item.sourceSignals.savedAttempts) {
    signals.push("saved attempts");
  }

  if (item.sourceSignals.outcomeFeedback) {
    signals.push("outcome feedback");
  }

  return signals.length > 0 ? signals.join(", ") : "default queue item";
}

export function selectCompactAdaptiveRecommendationId(
  items: readonly AdaptivePracticeQueueItem[],
  selectedItemId?: string | null
): string | null {
  if (selectedItemId && items.some((item) => item.id === selectedItemId)) {
    return selectedItemId;
  }

  return items[0]?.id ?? null;
}

export function buildCompactAdaptiveRecommendationDisplay(
  input: BuildCompactAdaptiveRecommendationDisplayInput
): CompactAdaptiveRecommendationDisplayModel {
  const availableExercises = input.availableExercises ?? [];
  const selectedId = selectCompactAdaptiveRecommendationId(input.items, input.selectedItemId);
  const selectedItem = input.items.find((item) => item.id === selectedId) ?? null;

  const rows = input.items.map((item, index) => {
    const linkedExercise = findLinkedExercise(item, availableExercises);

    return {
      id: item.id,
      number: index + 1,
      title: item.title,
      summary: item.practiceFocus,
      weakAreaLabel: labelFromSlugs(item.relatedWeakAreas, "Mixed practice"),
      priority: item.priority,
      status: input.itemStatuses?.[item.id] ?? "recommended",
      difficulty: linkedExercise?.difficulty ?? null,
      linkedExerciseLabel: linkedExerciseLabel(item, linkedExercise),
      isSelected: item.id === selectedId
    };
  });

  if (!selectedItem) {
    return {
      selectedId: null,
      selectedItem: null,
      rows,
      detail: null
    };
  }

  const linkedExercise = findLinkedExercise(selectedItem, availableExercises);

  return {
    selectedId,
    selectedItem,
    rows,
    detail: {
      id: selectedItem.id,
      title: selectedItem.title,
      explanation: selectedItem.explanation,
      practiceFocus: selectedItem.practiceFocus,
      weakAreaLabel: labelFromSlugs(selectedItem.relatedWeakAreas, "Mixed practice"),
      priority: selectedItem.priority,
      status: input.itemStatuses?.[selectedItem.id] ?? "recommended",
      score: selectedItem.score,
      difficulty: linkedExercise?.difficulty ?? null,
      linkedExerciseId: linkedExercise?.id ?? selectedItem.relatedExerciseIds[0] ?? null,
      linkedExerciseLabel: linkedExerciseLabel(selectedItem, linkedExercise),
      signalLabel: sourceSignalLabel(selectedItem),
      reasons: [...selectedItem.reasons]
    }
  };
}
