import type { SavedRouteAttemptListItem } from "./routeAttemptStorage.ts";

export type RouteWeakAreaAnalyticsType =
  | "one-way"
  | "no-entry"
  | "prohibited-turn"
  | "restricted-road"
  | "off-road-disconnected-drawing"
  | "missed-checkpoint"
  | "wrong-checkpoint-order"
  | "inefficient-legal-route"
  | "long-route-failure"
  | "wrong-start"
  | "wrong-destination"
  | "specific-road"
  | "specific-junction";

export type RouteWeakAreaAnalyticsPriority = "high" | "medium" | "low";
export type RouteWeakAreaTrend = "improving" | "stable" | "getting_worse" | "insufficient_data";

export type RouteWeakAreaAttemptSignals = {
  attemptId: string;
  occurredAt: string | null;
  weaknessTypes: RouteWeakAreaAnalyticsType[];
  roadIds: string[];
  junctionNodeIds: string[];
};

export type RouteWeakAreaAnalyticsItem = {
  id: string;
  type: RouteWeakAreaAnalyticsType;
  title: string;
  message: string;
  practiceFocus: string;
  priority: RouteWeakAreaAnalyticsPriority;
  count: number;
  recentCount: number;
  lastSeenAt: string | null;
  relatedRoadIds: string[];
  relatedJunctionNodeIds: string[];
  priorityScore: number;
};

export type RouteWeakAreaAnalyticsSummary = {
  totalAttempts: number;
  analysedAttempts: number;
  recentAttemptCount: number;
  trend: RouteWeakAreaTrend;
  trendMessage: string;
  topWeakAreas: RouteWeakAreaAnalyticsItem[];
  emptyMessage: string | null;
};

export type BuildRouteWeakAreaAnalyticsOptions = {
  recentAttemptWindow?: number;
  maxItems?: number;
};

type WeaknessDefinition = {
  title: string;
  message: string;
  practiceFocus: string;
  priority: RouteWeakAreaAnalyticsPriority;
};

type NormalisedAttempt = {
  attempt: SavedRouteAttemptListItem;
  chronologicalIndex: number;
};

type WeaknessAccumulator = {
  id: string;
  type: RouteWeakAreaAnalyticsType;
  title: string;
  message: string;
  practiceFocus: string;
  priority: RouteWeakAreaAnalyticsPriority;
  count: number;
  recentCount: number;
  lastSeenAt: string | null;
  lastSeenIndex: number;
  relatedRoadIds: Set<string>;
  relatedJunctionNodeIds: Set<string>;
};

const DEFAULT_RECENT_ATTEMPT_WINDOW = 3;
const DEFAULT_MAX_ITEMS = 6;

const weaknessDefinitions: Record<RouteWeakAreaAnalyticsType, WeaknessDefinition> = {
  "one-way": {
    title: "One-way systems",
    message: "You often lose marks on one-way systems.",
    practiceFocus: "Check the permitted direction before entering one-way roads.",
    priority: "high"
  },
  "no-entry": {
    title: "No-entry roads",
    message: "You repeatedly enter roads marked no entry.",
    practiceFocus: "Look for no-entry signs before committing to a road.",
    priority: "high"
  },
  "prohibited-turn": {
    title: "Prohibited turns",
    message: "You often lose marks on banned turns at junctions.",
    practiceFocus: "Pause at junctions and check turn restriction signs before choosing the next road.",
    priority: "high"
  },
  "restricted-road": {
    title: "Restricted roads",
    message: "You repeatedly use restricted or closed road movements.",
    practiceFocus: "Practise spotting restricted road markers before drawing through them.",
    priority: "high"
  },
  "off-road-disconnected-drawing": {
    title: "Disconnected drawings",
    message: "Your drawn route is sometimes disconnected or too far from the road network.",
    practiceFocus: "Draw continuously along connected roads and junctions.",
    priority: "high"
  },
  "missed-checkpoint": {
    title: "Missed checkpoints",
    message: "You missed checkpoints in recent attempts.",
    practiceFocus: "Plan the required stop sequence before drawing the route.",
    priority: "high"
  },
  "wrong-checkpoint-order": {
    title: "Checkpoint order",
    message: "You sometimes visit checkpoints in the wrong order.",
    practiceFocus: "Follow the exercise order exactly before heading to the destination.",
    priority: "high"
  },
  "inefficient-legal-route": {
    title: "Route efficiency",
    message: "Your legal routes are sometimes less efficient than the shortest legal route.",
    practiceFocus: "Compare alternatives and avoid unnecessary detours.",
    priority: "medium"
  },
  "long-route-failure": {
    title: "Long-route failures",
    message: "You frequently take routes that are too long.",
    practiceFocus: "Practise finding the shortest legal connection between each required stop.",
    priority: "medium"
  },
  "wrong-start": {
    title: "Wrong start",
    message: "Some attempts start away from the required start point.",
    practiceFocus: "Begin drawing from the start marker before heading toward the route.",
    priority: "high"
  },
  "wrong-destination": {
    title: "Wrong destination",
    message: "Some attempts finish away from the required destination.",
    practiceFocus: "Check the final destination marker before ending the route.",
    priority: "high"
  },
  "specific-road": {
    title: "Repeated road issue",
    message: "Repeated failures involve the same road.",
    practiceFocus: "Review the restriction and direction signs on this road.",
    priority: "medium"
  },
  "specific-junction": {
    title: "Repeated junction issue",
    message: "Repeated failures involve the same junction.",
    practiceFocus: "Review the signs and allowed movements at this junction.",
    priority: "medium"
  }
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateTimeValue(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

function addUnique<T>(items: T[], item: T): void {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function addUniqueSet<T>(items: Set<T>, values: Iterable<T>): void {
  for (const value of values) {
    items.add(value);
  }
}

function textFromReviewItem(item: unknown): string {
  const candidate = objectValue(item);

  return [
    candidate.id,
    candidate.kind,
    candidate.code,
    candidate.label,
    candidate.detail,
    candidate.reason,
    candidate.title,
    candidate.explanation,
    candidate.practiceFocus,
    candidate.weaknessType
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");
}

function issueTextsFromArray(value: unknown): string[] {
  return arrayValue(value)
    .map(textFromReviewItem)
    .filter((text) => text.length > 0);
}

function textsFromLegBreakdown(value: unknown): string[] {
  const texts: string[] = [];

  for (const item of arrayValue(value)) {
    const leg = objectValue(item);

    for (const reason of arrayValue(leg.failureReasons)) {
      if (typeof reason === "string") {
        texts.push(reason);
      }
    }

    texts.push(...issueTextsFromArray(leg.violations));
  }

  return texts;
}

function collectIssueTexts(attempt: SavedRouteAttemptListItem): string[] {
  const reviewPayload = objectValue(attempt.reviewPayload);
  const texts = [
    attempt.failureReason,
    attempt.reviewTitle,
    stringValue(reviewPayload.title),
    stringValue(reviewPayload.suggestedFailureReason)
  ].filter((text) => text.length > 0);

  texts.push(...issueTextsFromArray(reviewPayload.illegalMovements));
  texts.push(...issueTextsFromArray(reviewPayload.missedRestrictions));
  texts.push(...issueTextsFromArray(reviewPayload.practiceRecommendations));
  texts.push(...issueTextsFromArray(reviewPayload.recommendedPracticeQueue));

  for (const hint of arrayValue(reviewPayload.correctionHints)) {
    if (typeof hint === "string") {
      texts.push(hint);
    }
  }

  texts.push(...textsFromLegBreakdown(attempt.perLegBreakdown));

  return texts;
}

function weaknessFromQueueWeakness(value: unknown): RouteWeakAreaAnalyticsType | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value === "one-way-direction") {
    return "one-way";
  }

  if (value === "no-entry") {
    return "no-entry";
  }

  if (value === "prohibited-turn") {
    return "prohibited-turn";
  }

  if (value === "restricted-road") {
    return "restricted-road";
  }

  if (value === "disconnected-drawing" || value === "insufficient-drawing") {
    return "off-road-disconnected-drawing";
  }

  if (value === "missed-checkpoint") {
    return "missed-checkpoint";
  }

  if (value === "route-efficiency") {
    return "inefficient-legal-route";
  }

  if (value === "wrong-start") {
    return "wrong-start";
  }

  if (value === "wrong-destination") {
    return "wrong-destination";
  }

  return null;
}

function weaknessTypesFromText(text: string): RouteWeakAreaAnalyticsType[] {
  const lower = text.toLowerCase();
  const types: RouteWeakAreaAnalyticsType[] = [];

  if (lower.includes("no-entry") || lower.includes("no entry")) {
    addUnique(types, "no-entry");
  }

  if (lower.includes("one-way") || lower.includes("one way") || lower.includes("wrong way")) {
    addUnique(types, "one-way");
  }

  if (
    lower.includes("prohibited turn") ||
    lower.includes("banned turn") ||
    lower.includes("no left") ||
    lower.includes("no right") ||
    lower.includes("u-turn") ||
    lower.includes("u turn")
  ) {
    addUnique(types, "prohibited-turn");
  }

  if (lower.includes("restricted road") || lower.includes("closed road") || lower.includes("restricted or closed")) {
    addUnique(types, "restricted-road");
  }

  if (
    lower.includes("disconnected") ||
    lower.includes("off-road") ||
    lower.includes("off road") ||
    lower.includes("matching_failed") ||
    lower.includes("snapping_failed") ||
    lower.includes("insufficient drawing") ||
    lower.includes("no route drawn")
  ) {
    addUnique(types, "off-road-disconnected-drawing");
  }

  if (
    lower.includes("wrong checkpoint order") ||
    lower.includes("checkpoint order") ||
    lower.includes("out of order")
  ) {
    addUnique(types, "wrong-checkpoint-order");
  }

  if (
    lower.includes("missed checkpoint") ||
    lower.includes("missed required") ||
    lower.includes("missed_required_stop") ||
    lower.includes("missing checkpoint")
  ) {
    addUnique(types, "missed-checkpoint");
  }

  if (lower.includes("wrong_start") || lower.includes("wrong start") || lower.includes("required start")) {
    addUnique(types, "wrong-start");
  }

  if (
    lower.includes("wrong_destination") ||
    lower.includes("wrong destination") ||
    lower.includes("required destination")
  ) {
    addUnique(types, "wrong-destination");
  }

  if (
    lower.includes("below_efficiency_threshold") ||
    lower.includes("efficiency") ||
    lower.includes("inefficient")
  ) {
    addUnique(types, "inefficient-legal-route");
  }

  if (lower.includes("too long") || lower.includes("long route") || lower.includes("route-too-long")) {
    addUnique(types, "long-route-failure");
  }

  return types;
}

function scorePercentValue(scoreLabel: string): number | null {
  const match = /(-?\d+(?:\.\d+)?)/.exec(scoreLabel);

  if (!match) {
    return null;
  }

  const score = Number.parseFloat(match[1]);

  return Number.isFinite(score) ? score : null;
}

function isFailedAttempt(attempt: SavedRouteAttemptListItem): boolean {
  return attempt.passed === false || attempt.statusLabel === "Fail" || attempt.statusLabel === "Blocked";
}

function addEfficiencySignals(attempt: SavedRouteAttemptListItem, types: RouteWeakAreaAnalyticsType[]): void {
  if (!isFailedAttempt(attempt)) {
    return;
  }

  const score = scorePercentValue(attempt.scoreLabel);
  const extraDistance = numberValue(attempt.extraDistanceMeters);
  const shortestDistance = numberValue(attempt.shortestDistanceMeters);
  const looksLegal = attempt.isLegal === true || attempt.isLegal === null;

  if (looksLegal && score !== null && score < 80) {
    addUnique(types, "inefficient-legal-route");
  }

  if (
    looksLegal &&
    extraDistance !== null &&
    extraDistance > 0 &&
    (shortestDistance === null || shortestDistance <= 0 || extraDistance / shortestDistance >= 0.2)
  ) {
    addUnique(types, "long-route-failure");
  }
}

function extractIds(text: string, pattern: RegExp): string[] {
  return Array.from(text.matchAll(pattern), (match) => match[0]);
}

function uniqueSortedIds(ids: Iterable<string>): string[] {
  return Array.from(new Set(ids)).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

export function extractWeakAreaSignalsFromAttempt(attempt: SavedRouteAttemptListItem): RouteWeakAreaAttemptSignals {
  const reviewPayload = objectValue(attempt.reviewPayload);
  const types: RouteWeakAreaAnalyticsType[] = [];
  const roadIds = new Set<string>();
  const junctionNodeIds = new Set<string>();
  const issueTexts = collectIssueTexts(attempt);

  for (const item of arrayValue(reviewPayload.recommendedPracticeQueue)) {
    const weakness = weaknessFromQueueWeakness(objectValue(item).weaknessType);

    if (weakness) {
      addUnique(types, weakness);
    }
  }

  for (const text of issueTexts) {
    for (const type of weaknessTypesFromText(text)) {
      addUnique(types, type);
    }

    addUniqueSet(roadIds, extractIds(text, /\br\d+\b/g));
    addUniqueSet(junctionNodeIds, extractIds(text, /\bn\d+\b/g));
  }

  addEfficiencySignals(attempt, types);

  return {
    attemptId: attempt.id,
    occurredAt: attempt.createdAt,
    weaknessTypes: types,
    roadIds: uniqueSortedIds(roadIds),
    junctionNodeIds: uniqueSortedIds(junctionNodeIds)
  };
}

function priorityWeight(priority: RouteWeakAreaAnalyticsPriority): number {
  if (priority === "high") {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  return 1;
}

function normaliseAttempts(attempts: readonly SavedRouteAttemptListItem[]): NormalisedAttempt[] {
  return attempts
    .map((attempt, originalIndex) => ({
      attempt,
      originalIndex,
      timestamp: dateTimeValue(attempt.createdAt)
    }))
    .sort((left, right) => {
      if (left.timestamp !== null && right.timestamp !== null && left.timestamp !== right.timestamp) {
        return left.timestamp - right.timestamp;
      }

      if (left.timestamp !== null && right.timestamp === null) {
        return -1;
      }

      if (left.timestamp === null && right.timestamp !== null) {
        return 1;
      }

      return left.originalIndex - right.originalIndex;
    })
    .map((item, chronologicalIndex) => ({
      attempt: item.attempt,
      chronologicalIndex
    }));
}

function addAccumulatorSignal(input: {
  accumulators: Map<string, WeaknessAccumulator>;
  id: string;
  type: RouteWeakAreaAnalyticsType;
  attempt: SavedRouteAttemptListItem;
  chronologicalIndex: number;
  isRecent: boolean;
  roadIds?: readonly string[];
  junctionNodeIds?: readonly string[];
}): void {
  const definition = weaknessDefinitions[input.type];
  const existing = input.accumulators.get(input.id);

  if (existing) {
    existing.count += 1;
    existing.recentCount += input.isRecent ? 1 : 0;
    existing.lastSeenAt = input.attempt.createdAt ?? existing.lastSeenAt;
    existing.lastSeenIndex = Math.max(existing.lastSeenIndex, input.chronologicalIndex);
    addUniqueSet(existing.relatedRoadIds, input.roadIds ?? []);
    addUniqueSet(existing.relatedJunctionNodeIds, input.junctionNodeIds ?? []);
    return;
  }

  input.accumulators.set(input.id, {
    id: input.id,
    type: input.type,
    title: definition.title,
    message: definition.message,
    practiceFocus: definition.practiceFocus,
    priority: definition.priority,
    count: 1,
    recentCount: input.isRecent ? 1 : 0,
    lastSeenAt: input.attempt.createdAt,
    lastSeenIndex: input.chronologicalIndex,
    relatedRoadIds: new Set(input.roadIds ?? []),
    relatedJunctionNodeIds: new Set(input.junctionNodeIds ?? [])
  });
}

function addSpecificRoadSignals(input: {
  accumulators: Map<string, WeaknessAccumulator>;
  signals: RouteWeakAreaAttemptSignals;
  attempt: SavedRouteAttemptListItem;
  chronologicalIndex: number;
  isRecent: boolean;
}): void {
  if (!isFailedAttempt(input.attempt)) {
    return;
  }

  for (const roadId of input.signals.roadIds) {
    addAccumulatorSignal({
      accumulators: input.accumulators,
      id: `specific-road:${roadId}`,
      type: "specific-road",
      attempt: input.attempt,
      chronologicalIndex: input.chronologicalIndex,
      isRecent: input.isRecent,
      roadIds: [roadId]
    });
  }

  for (const nodeId of input.signals.junctionNodeIds) {
    addAccumulatorSignal({
      accumulators: input.accumulators,
      id: `specific-junction:${nodeId}`,
      type: "specific-junction",
      attempt: input.attempt,
      chronologicalIndex: input.chronologicalIndex,
      isRecent: input.isRecent,
      junctionNodeIds: [nodeId]
    });
  }
}

function specificItemTitle(accumulator: WeaknessAccumulator): string {
  if (accumulator.type === "specific-road") {
    const roadId = uniqueSortedIds(accumulator.relatedRoadIds)[0] ?? "unknown road";

    return `Repeated issue on ${roadId}`;
  }

  if (accumulator.type === "specific-junction") {
    const nodeId = uniqueSortedIds(accumulator.relatedJunctionNodeIds)[0] ?? "unknown junction";

    return `Repeated issue at ${nodeId}`;
  }

  return accumulator.title;
}

function specificItemMessage(accumulator: WeaknessAccumulator): string {
  if (accumulator.type === "specific-road") {
    const roadId = uniqueSortedIds(accumulator.relatedRoadIds)[0] ?? "this road";

    return `Repeated failures involve ${roadId}.`;
  }

  if (accumulator.type === "specific-junction") {
    const nodeId = uniqueSortedIds(accumulator.relatedJunctionNodeIds)[0] ?? "this junction";

    return `Repeated failures involve ${nodeId}.`;
  }

  return accumulator.message;
}

function accumulatorToItem(accumulator: WeaknessAccumulator, attemptCount: number): RouteWeakAreaAnalyticsItem {
  const recencyBoost = attemptCount > 0 ? ((accumulator.lastSeenIndex + 1) / attemptCount) * 5 : 0;
  const priorityScore =
    accumulator.count * 100 + accumulator.recentCount * 25 + recencyBoost + priorityWeight(accumulator.priority);

  return {
    id: accumulator.id,
    type: accumulator.type,
    title: specificItemTitle(accumulator),
    message: specificItemMessage(accumulator),
    practiceFocus: accumulator.practiceFocus,
    priority: accumulator.priority,
    count: accumulator.count,
    recentCount: accumulator.recentCount,
    lastSeenAt: accumulator.lastSeenAt,
    relatedRoadIds: uniqueSortedIds(accumulator.relatedRoadIds),
    relatedJunctionNodeIds: uniqueSortedIds(accumulator.relatedJunctionNodeIds),
    priorityScore
  };
}

function compareAnalyticsItems(left: RouteWeakAreaAnalyticsItem, right: RouteWeakAreaAnalyticsItem): number {
  return (
    right.priorityScore - left.priorityScore ||
    right.count - left.count ||
    right.recentCount - left.recentCount ||
    left.title.localeCompare(right.title)
  );
}

function weaknessCountForSignals(signals: RouteWeakAreaAttemptSignals): number {
  return signals.weaknessTypes.length;
}

function averageWeaknessCount(signals: readonly RouteWeakAreaAttemptSignals[]): number {
  if (signals.length === 0) {
    return 0;
  }

  return signals.reduce((total, item) => total + weaknessCountForSignals(item), 0) / signals.length;
}

function routeWeakAreaTrend(signals: readonly RouteWeakAreaAttemptSignals[]): RouteWeakAreaTrend {
  if (signals.length < 3) {
    return "insufficient_data";
  }

  const midpoint = Math.floor(signals.length / 2);
  const earlierAverage = averageWeaknessCount(signals.slice(0, midpoint));
  const recentAverage = averageWeaknessCount(signals.slice(midpoint));

  if (recentAverage <= earlierAverage - 0.25) {
    return "improving";
  }

  if (recentAverage >= earlierAverage + 0.25) {
    return "getting_worse";
  }

  return "stable";
}

function trendMessage(trend: RouteWeakAreaTrend): string {
  if (trend === "improving") {
    return "Recent attempts show fewer weak-area signals than earlier attempts.";
  }

  if (trend === "getting_worse") {
    return "Recent attempts show more weak-area signals than earlier attempts.";
  }

  if (trend === "stable") {
    return "Recent attempts show a stable weak-area pattern.";
  }

  return "More saved attempts are needed before a reliable trend can be shown.";
}

export function buildRouteWeakAreaAnalytics(
  attempts: readonly SavedRouteAttemptListItem[],
  options: BuildRouteWeakAreaAnalyticsOptions = {}
): RouteWeakAreaAnalyticsSummary {
  const recentAttemptWindow = Math.max(1, Math.floor(options.recentAttemptWindow ?? DEFAULT_RECENT_ATTEMPT_WINDOW));
  const maxItems = Math.max(0, Math.floor(options.maxItems ?? DEFAULT_MAX_ITEMS));
  const normalisedAttempts = normaliseAttempts(attempts);
  const recentStartIndex = Math.max(0, normalisedAttempts.length - recentAttemptWindow);
  const accumulators = new Map<string, WeaknessAccumulator>();
  const attemptSignals: RouteWeakAreaAttemptSignals[] = [];

  for (const { attempt, chronologicalIndex } of normalisedAttempts) {
    const signals = extractWeakAreaSignalsFromAttempt(attempt);
    const isRecent = chronologicalIndex >= recentStartIndex;

    attemptSignals.push(signals);

    for (const type of signals.weaknessTypes) {
      addAccumulatorSignal({
        accumulators,
        id: type,
        type,
        attempt,
        chronologicalIndex,
        isRecent,
        roadIds: signals.roadIds,
        junctionNodeIds: signals.junctionNodeIds
      });
    }

    addSpecificRoadSignals({
      accumulators,
      signals,
      attempt,
      chronologicalIndex,
      isRecent
    });
  }

  const topWeakAreas = Array.from(accumulators.values())
    .map((accumulator) => accumulatorToItem(accumulator, normalisedAttempts.length))
    .filter((item) => item.type !== "specific-road" && item.type !== "specific-junction" ? true : item.count > 1)
    .sort(compareAnalyticsItems)
    .slice(0, maxItems);
  const trend = routeWeakAreaTrend(attemptSignals);

  return {
    totalAttempts: attempts.length,
    analysedAttempts: normalisedAttempts.length,
    recentAttemptCount: Math.min(recentAttemptWindow, normalisedAttempts.length),
    trend,
    trendMessage: trendMessage(trend),
    topWeakAreas,
    emptyMessage:
      attempts.length === 0
        ? "No saved route attempts yet. Submit route attempts to build weak-area analytics."
        : topWeakAreas.length === 0
          ? "No repeated weak areas are visible in saved attempts yet."
          : null
  };
}
