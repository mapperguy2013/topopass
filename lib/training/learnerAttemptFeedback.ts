import type { MapDefinition, MapNode, MapRoad, RouteStop } from "../map-engine/index.ts";
import type {
  DrivingFaultCategory,
  DrivingFaultSeverity,
  InstructorFeedback
} from "./learnerDriverTraining.ts";
import type { GeneratedLearnerExercise } from "./learnerExerciseGeneration.ts";
import type {
  LearnerAttemptRouteSegmentAnnotation,
  LearnerAttemptScoredFault,
  LearnerAttemptScoringResult,
  ScorableLearnerExercise
} from "./learnerAttemptScoring.ts";

export const LEARNER_FEEDBACK_CATEGORIES = [
  "legal-validity",
  "route-adherence",
  "observation-planning",
  "junction-handling",
  "roundabout-handling",
  "recovery",
  "efficiency",
  "hint-dependence"
] as const;

export type LearnerFeedbackCategory = (typeof LEARNER_FEEDBACK_CATEGORIES)[number];

export const LEARNER_FEEDBACK_CATEGORY_LABELS: Record<LearnerFeedbackCategory, string> = {
  "legal-validity": "Legal validity",
  "route-adherence": "Route adherence",
  "observation-planning": "Observation/planning",
  "junction-handling": "Junction handling",
  "roundabout-handling": "Roundabout handling",
  recovery: "Recovery",
  efficiency: "Efficiency",
  "hint-dependence": "Hint dependence"
};

export type LearnerFeedbackIssueType =
  | "legal"
  | "safety"
  | "route-following"
  | "efficiency"
  | "planning"
  | "support";

export type LearnerAttemptFeedbackMessage = {
  id: string;
  category: LearnerFeedbackCategory;
  categoryLabel: string;
  issueType: LearnerFeedbackIssueType;
  severity: DrivingFaultSeverity | "positive";
  priority: number;
  faultIds: string[];
  routeSegmentIds: string[];
  roadIds: string[];
  nodeIds: string[];
  location: string;
  whatHappened: string;
  whyItMatters: string;
  improvementSuggestion: string;
};

export type LearnerAttemptSegmentFeedback = {
  routeSegmentId: string;
  roadId: string;
  attemptedSegmentIndex: number | null;
  expectedSegmentIndex?: number;
  categoryLabels: string[];
  faultIds: string[];
  feedbackMessageIds: string[];
  summary: string;
  improvementSuggestion?: string;
};

export type LearnerAttemptFeedbackResult = {
  attemptId: string;
  summary: string;
  scorePercent: number;
  passed: boolean;
  status: LearnerAttemptScoringResult["status"];
  messages: LearnerAttemptFeedbackMessage[];
  segmentFeedback: LearnerAttemptSegmentFeedback[];
  strengths: string[];
  improvements: string[];
  instructorFeedback?: InstructorFeedback;
};

export type GenerateLearnerAttemptFeedbackInput = {
  scoring: LearnerAttemptScoringResult;
  map?: MapDefinition;
  exercise?: ScorableLearnerExercise | GeneratedLearnerExercise;
  learnerId?: string;
  instructorId?: string;
  createdAt?: string;
};

type FeedbackTemplate = {
  category: LearnerFeedbackCategory;
  issueType: LearnerFeedbackIssueType;
  whatHappened: string;
  whyItMatters: string;
  improvementSuggestion: string;
};

type FeedbackContext = {
  scoring: LearnerAttemptScoringResult;
  map?: MapDefinition;
  exercise?: ScorableLearnerExercise | GeneratedLearnerExercise;
};

const severityPriority: Record<DrivingFaultSeverity | "positive", number> = {
  dangerous: 0,
  serious: 1,
  minor: 2,
  observation: 3,
  positive: 4
};

const categoryPriority: Record<LearnerFeedbackCategory, number> = {
  "legal-validity": 0,
  "junction-handling": 1,
  "roundabout-handling": 2,
  "route-adherence": 3,
  recovery: 4,
  efficiency: 5,
  "observation-planning": 6,
  "hint-dependence": 7
};

const routeAdherenceFaultCategories = new Set<DrivingFaultCategory>([
  "wrong-start",
  "wrong-destination",
  "missed-checkpoint",
  "route-drawing"
]);

const legalFaultCategories = new Set<DrivingFaultCategory>([
  "no-entry",
  "one-way-direction",
  "prohibited-turn",
  "restricted-road"
]);

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function mapNodesById(map: MapDefinition | undefined): Record<string, MapNode> {
  return Object.fromEntries((map?.nodes ?? []).map((node) => [node.id, node]));
}

function mapRoadsById(map: MapDefinition | undefined): Record<string, MapRoad> {
  return Object.fromEntries((map?.roads ?? []).map((road) => [road.id, road]));
}

function routeStopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function checkpointLabelsByNodeId(
  exercise: ScorableLearnerExercise | GeneratedLearnerExercise | undefined
): Record<string, string> {
  return Object.fromEntries(
    (exercise?.checkpoints ?? [])
      .map((stop) => {
        const nodeId = routeStopNodeId(stop);

        return nodeId ? [nodeId, stop.label ?? nodeId] : null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  );
}

function humanList(values: readonly string[]): string {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function roadLabel(roadsById: Record<string, MapRoad>, roadId: string): string {
  const road = roadsById[roadId];

  return road?.name ? `${road.name} (${roadId})` : roadId;
}

function nodeLabel(
  nodesById: Record<string, MapNode>,
  checkpointLabels: Record<string, string>,
  nodeId: string
): string {
  const checkpointLabel = checkpointLabels[nodeId];
  const mapLabel = nodesById[nodeId]?.label;

  if (checkpointLabel && checkpointLabel !== nodeId) {
    return `${checkpointLabel} (${nodeId})`;
  }

  return mapLabel ? `${mapLabel} (${nodeId})` : nodeId;
}

function annotationsForFault(
  scoring: LearnerAttemptScoringResult,
  fault: LearnerAttemptScoredFault
): LearnerAttemptRouteSegmentAnnotation[] {
  return scoring.routeSegmentAnnotations.filter(
    (annotation) =>
      annotation.faultIds.includes(fault.id) || fault.routeSegmentIds.includes(annotation.routeSegmentId)
  );
}

function attemptedSegmentLabel(annotation: LearnerAttemptRouteSegmentAnnotation): string {
  if (annotation.attemptedSegmentIndex !== null) {
    return `attempted segment ${annotation.attemptedSegmentIndex + 1}`;
  }

  if (typeof annotation.expectedSegmentIndex === "number") {
    return `planned segment ${annotation.expectedSegmentIndex + 1}`;
  }

  return "a route segment";
}

function locationForFault(
  fault: LearnerAttemptScoredFault,
  context: FeedbackContext
): string {
  const roadsById = mapRoadsById(context.map);
  const nodesById = mapNodesById(context.map);
  const checkpointLabels = checkpointLabelsByNodeId(context.exercise);
  const annotations = annotationsForFault(context.scoring, fault);
  const segmentLocations = annotations.map((annotation) => {
    return `${attemptedSegmentLabel(annotation)} on ${roadLabel(roadsById, annotation.roadId)}`;
  });

  if (segmentLocations.length > 0) {
    return humanList(uniqueStrings(segmentLocations));
  }

  if (fault.relatedNodeIds && fault.relatedNodeIds.length > 0) {
    const nodeLocations = fault.relatedNodeIds.map((nodeId) => nodeLabel(nodesById, checkpointLabels, nodeId));

    return `checkpoint or junction ${humanList(uniqueStrings(nodeLocations))}`;
  }

  if (fault.relatedRoadIds && fault.relatedRoadIds.length > 0) {
    const roadLocations = fault.relatedRoadIds.map((roadId) => roadLabel(roadsById, roadId));

    return `road ${humanList(uniqueStrings(roadLocations))}`;
  }

  return "the submitted route";
}

function isRecoveryFault(fault: LearnerAttemptScoredFault): boolean {
  const text = `${fault.title} ${fault.detail ?? ""}`.toLowerCase();

  if (/not recovered|did not recover|without recover/.test(text)) {
    return false;
  }

  return /recovered|recovery/.test(text);
}

function isHintFault(fault: LearnerAttemptScoredFault): boolean {
  return fault.category === "map-reading" && /hint/i.test(`${fault.title} ${fault.detail ?? ""}`);
}

function feedbackCategoryForFault(fault: LearnerAttemptScoredFault): LearnerFeedbackCategory {
  if (isHintFault(fault)) {
    return "hint-dependence";
  }

  if (isRecoveryFault(fault)) {
    return "recovery";
  }

  if (legalFaultCategories.has(fault.category)) {
    return "legal-validity";
  }

  if (routeAdherenceFaultCategories.has(fault.category)) {
    return "route-adherence";
  }

  if (fault.category === "unsafe-junction-decision") {
    return "junction-handling";
  }

  if (fault.category === "roundabout-decision") {
    return "roundabout-handling";
  }

  if (fault.category === "route-efficiency") {
    return "efficiency";
  }

  return "observation-planning";
}

function issueTypeForCategory(category: LearnerFeedbackCategory): LearnerFeedbackIssueType {
  if (category === "legal-validity") {
    return "legal";
  }

  if (category === "junction-handling" || category === "roundabout-handling") {
    return "safety";
  }

  if (category === "route-adherence" || category === "recovery") {
    return "route-following";
  }

  if (category === "efficiency") {
    return "efficiency";
  }

  if (category === "hint-dependence" || category === "observation-planning") {
    return "planning";
  }

  return "support";
}

function ruleCodesInclude(fault: LearnerAttemptScoredFault, code: string): boolean {
  return fault.ruleCodes?.includes(code as NonNullable<LearnerAttemptScoredFault["ruleCodes"]>[number]) ?? false;
}

function templateForFault(fault: LearnerAttemptScoredFault): FeedbackTemplate {
  const category = feedbackCategoryForFault(fault);
  const issueType = issueTypeForCategory(category);

  if (fault.category === "one-way-direction" || ruleCodesInclude(fault, "wrong-way-one-way")) {
    return {
      category,
      issueType,
      whatHappened: "You turned onto a segment marked one-way in the opposite direction.",
      whyItMatters: "This is a serious route-validity fault because the available map data says traffic must not travel that way.",
      improvementSuggestion: "Before committing to the turn, check the one-way direction and choose a segment that follows permitted traffic flow."
    };
  }

  if (fault.category === "no-entry" || ruleCodesInclude(fault, "no-entry-restriction")) {
    return {
      category,
      issueType,
      whatHappened: "You used a movement marked no-entry in the map data.",
      whyItMatters: "A no-entry movement makes the route legally invalid where that restriction is available.",
      improvementSuggestion: "Pause before the junction, identify the permitted outgoing roads, and route around the no-entry segment."
    };
  }

  if (fault.category === "prohibited-turn" || ruleCodesInclude(fault, "prohibited-turn")) {
    return {
      category,
      issueType,
      whatHappened: "You selected a turn that is explicitly prohibited in the map data.",
      whyItMatters: "The route cannot be treated as legally valid when a mapped turn restriction is ignored.",
      improvementSuggestion: "At the decision point, compare the planned next road with the allowed movements before starting the turn."
    };
  }

  if (fault.category === "restricted-road" || ruleCodesInclude(fault, "non-drivable-segment")) {
    return {
      category,
      issueType,
      whatHappened: "You used a segment marked restricted or non-drivable for learner-driver routing.",
      whyItMatters: "This is a blocking route-validity fault when the project data identifies the segment as private, pedestrian-only, cycle-only, closed, or otherwise restricted.",
      improvementSuggestion: "Choose the nearest public drivable road segment and rejoin the route without using the restricted road."
    };
  }

  if (fault.category === "missed-checkpoint") {
    return {
      category,
      issueType,
      whatHappened: "You missed the planned checkpoint after the junction.",
      whyItMatters: "Checkpoints confirm that you are still following the exercise route in the required order.",
      improvementSuggestion: "Recheck the road name and checkpoint marker before committing to the turn."
    };
  }

  if (fault.category === "wrong-start") {
    return {
      category,
      issueType,
      whatHappened: "You did not begin from the planned start of the exercise.",
      whyItMatters: "Starting from the wrong point makes the route review unreliable because the first instruction and distance checks no longer match the exercise.",
      improvementSuggestion: "Set the start point first, then confirm the first road segment before drawing or driving the route."
    };
  }

  if (fault.category === "wrong-destination") {
    return {
      category,
      issueType,
      whatHappened: "The attempt did not finish at the planned destination.",
      whyItMatters: "A route is incomplete until it reaches the final checkpoint or destination in the exercise.",
      improvementSuggestion: "Keep the destination visible in the plan and confirm the final road name before ending the attempt."
    };
  }

  if (fault.category === "route-drawing") {
    return {
      category,
      issueType,
      whatHappened: "The submitted route contained a movement that the map data cannot connect as a real road sequence.",
      whyItMatters: "A learner route must move continuously from one drivable segment to the next without impossible jumps.",
      improvementSuggestion: "Trace the route segment by segment and reconnect the break using adjacent roads in the map graph."
    };
  }

  if (fault.category === "unsafe-junction-decision" && isRecoveryFault(fault)) {
    return {
      category,
      issueType,
      whatHappened: "You recovered after the wrong turn, but the route briefly left the planned path.",
      whyItMatters: "Recovery keeps the attempt usable, but the detour can add distance and extra junction decisions.",
      improvementSuggestion: "When you notice the error, use the next safe decision point to return by the shortest legal connecting road."
    };
  }

  if (fault.category === "unsafe-junction-decision") {
    return {
      category,
      issueType,
      whatHappened: "You chose a junction movement that took the route away from the planned path.",
      whyItMatters: "Wrong turns at junctions increase workload and can lead to illegal or unsafe route choices.",
      improvementSuggestion: "Slow the decision down, identify the intended road, and commit only when the lane and turn match the instruction."
    };
  }

  if (fault.category === "roundabout-decision") {
    return {
      category,
      issueType,
      whatHappened: "The attempt showed too much roundabout complexity for this exercise.",
      whyItMatters: "Roundabouts require earlier lane planning, exit counting, and observation than a simple turn.",
      improvementSuggestion: "Count the intended exit before entry and keep checking the route instruction as you approach the roundabout."
    };
  }

  if (fault.category === "route-efficiency") {
    return {
      category,
      issueType,
      whatHappened: fault.title === "Small detour"
        ? "You completed the route with a small unnecessary detour."
        : "The route added unnecessary distance or time compared with the generated route.",
      whyItMatters: "Efficient recovery matters because extra distance usually creates extra junction decisions and more chances to make another mistake.",
      improvementSuggestion: "After any deviation, choose the shortest legal connection back to the planned route instead of continuing away from it."
    };
  }

  if (isHintFault(fault)) {
    return {
      category,
      issueType,
      whatHappened: "You relied on hints during the attempt.",
      whyItMatters: "Hints are useful for learning, but frequent or high-level hints reduce independent planning confidence.",
      improvementSuggestion: "Before requesting the next hint, state the next road, restriction, or checkpoint you expect to use, then check it against the route."
    };
  }

  return {
    category,
    issueType,
    whatHappened: fault.detail ?? fault.title,
    whyItMatters: "This planning issue affects how reliably you can follow the route without instructor support.",
    improvementSuggestion: "Use the next instruction to confirm the road name, direction, and checkpoint before moving on."
  };
}

function messagePriority(fault: LearnerAttemptScoredFault, category: LearnerFeedbackCategory): number {
  return severityPriority[fault.severity] * 100 + categoryPriority[category] * 10 + (fault.blocking ? 0 : 1);
}

function messageForFault(
  fault: LearnerAttemptScoredFault,
  context: FeedbackContext,
  sequence: number
): LearnerAttemptFeedbackMessage {
  const template = templateForFault(fault);

  return {
    id: `${context.scoring.attemptId}-feedback-${String(sequence).padStart(2, "0")}`,
    category: template.category,
    categoryLabel: LEARNER_FEEDBACK_CATEGORY_LABELS[template.category],
    issueType: template.issueType,
    severity: fault.severity,
    priority: messagePriority(fault, template.category),
    faultIds: [fault.id],
    routeSegmentIds: uniqueStrings(fault.routeSegmentIds),
    roadIds: uniqueStrings(fault.relatedRoadIds ?? []),
    nodeIds: uniqueStrings(fault.relatedNodeIds ?? []),
    location: locationForFault(fault, context),
    whatHappened: template.whatHappened,
    whyItMatters: template.whyItMatters,
    improvementSuggestion: template.improvementSuggestion
  };
}

function messageKey(message: LearnerAttemptFeedbackMessage): string {
  return [
    message.category,
    message.severity,
    message.location,
    message.whatHappened,
    message.improvementSuggestion
  ].join("|");
}

function mergeMessage(
  existing: LearnerAttemptFeedbackMessage,
  incoming: LearnerAttemptFeedbackMessage
): LearnerAttemptFeedbackMessage {
  return {
    ...existing,
    priority: Math.min(existing.priority, incoming.priority),
    faultIds: uniqueStrings([...existing.faultIds, ...incoming.faultIds]),
    routeSegmentIds: uniqueStrings([...existing.routeSegmentIds, ...incoming.routeSegmentIds]),
    roadIds: uniqueStrings([...existing.roadIds, ...incoming.roadIds]),
    nodeIds: uniqueStrings([...existing.nodeIds, ...incoming.nodeIds])
  };
}

function dedupeAndSortMessages(messages: readonly LearnerAttemptFeedbackMessage[]): LearnerAttemptFeedbackMessage[] {
  const byKey = new Map<string, LearnerAttemptFeedbackMessage>();

  for (const message of messages) {
    const key = messageKey(message);
    const existing = byKey.get(key);

    byKey.set(key, existing ? mergeMessage(existing, message) : message);
  }

  return [...byKey.values()].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.id.localeCompare(right.id);
  });
}

function cleanAttemptStrengths(scoring: LearnerAttemptScoringResult): string[] {
  if (scoring.faults.length > 0) {
    const strengths: string[] = [];

    if (scoring.completed) {
      strengths.push("You completed the route to the planned destination.");
    }

    if (scoring.validation.valid) {
      strengths.push("Your submitted route stayed within the legal checks available in the map data.");
    }

    if (scoring.metrics.routeAdherencePercent >= 80) {
      strengths.push(`You kept ${scoring.metrics.routeAdherencePercent.toFixed(1)}% route adherence despite the recorded faults.`);
    }

    return strengths;
  }

  return [
    `You followed the planned route with ${scoring.metrics.routeAdherencePercent.toFixed(1)}% route adherence.`,
    "You reached each required checkpoint without a legal-validity fault.",
    `Your route efficiency was ${scoring.metrics.efficiencyPercent.toFixed(1)}%.`
  ];
}

function cleanAttemptMessage(scoring: LearnerAttemptScoringResult): LearnerAttemptFeedbackMessage {
  return {
    id: `${scoring.attemptId}-feedback-positive`,
    category: "route-adherence",
    categoryLabel: LEARNER_FEEDBACK_CATEGORY_LABELS["route-adherence"],
    issueType: "support",
    severity: "positive",
    priority: severityPriority.positive * 100,
    faultIds: [],
    routeSegmentIds: [],
    roadIds: [],
    nodeIds: [],
    location: "the full planned route",
    whatHappened: "You completed the planned route without recorded validation or scoring faults.",
    whyItMatters: "That shows you can follow the exercise instructions, checkpoints, and available legal route checks consistently.",
    improvementSuggestion: "Keep using the same habit: confirm the next road, restriction, and checkpoint before each decision point."
  };
}

function summaryForResult(
  scoring: LearnerAttemptScoringResult,
  messages: readonly LearnerAttemptFeedbackMessage[]
): string {
  if (scoring.faults.length === 0) {
    return `Pass at ${scoring.scorePercent.toFixed(1)}%. You followed the planned route and reached the checkpoints without recorded faults.`;
  }

  const firstMessage = messages[0];
  const status = scoring.status === "passed"
    ? "Pass"
    : scoring.status === "blocked"
      ? "Blocked"
      : scoring.status === "incomplete"
        ? "Incomplete"
        : "Fail";

  return `${status} at ${scoring.scorePercent.toFixed(1)}%. Main issue: ${firstMessage.whatHappened} Location: ${firstMessage.location}.`;
}

function segmentFeedback(
  scoring: LearnerAttemptScoringResult,
  messages: readonly LearnerAttemptFeedbackMessage[]
): LearnerAttemptSegmentFeedback[] {
  const messagesByFaultId = new Map<string, LearnerAttemptFeedbackMessage[]>();
  const feedbackItems: LearnerAttemptSegmentFeedback[] = [];

  for (const message of messages) {
    for (const faultId of message.faultIds) {
      messagesByFaultId.set(faultId, [...(messagesByFaultId.get(faultId) ?? []), message]);
    }
  }

  for (const annotation of scoring.routeSegmentAnnotations) {
    const linkedMessages = uniqueStrings(annotation.faultIds)
      .flatMap((faultId) => messagesByFaultId.get(faultId) ?? []);

    if (linkedMessages.length === 0) {
      continue;
    }

    const sortedMessages = dedupeAndSortMessages(linkedMessages);
    const primary = sortedMessages[0];
    const item: LearnerAttemptSegmentFeedback = {
      routeSegmentId: annotation.routeSegmentId,
      roadId: annotation.roadId,
      attemptedSegmentIndex: annotation.attemptedSegmentIndex,
      categoryLabels: uniqueStrings(sortedMessages.map((message) => message.categoryLabel)),
      faultIds: uniqueStrings(annotation.faultIds),
      feedbackMessageIds: uniqueStrings(sortedMessages.map((message) => message.id)),
      summary: `${primary.categoryLabel}: ${primary.whatHappened}`,
      improvementSuggestion: primary.improvementSuggestion
    };

    if (typeof annotation.expectedSegmentIndex === "number") {
      item.expectedSegmentIndex = annotation.expectedSegmentIndex;
    }

    feedbackItems.push(item);
  }

  return feedbackItems;
}

function instructorFeedbackForInput(input: {
  scoring: LearnerAttemptScoringResult;
  summary: string;
  strengths: readonly string[];
  improvements: readonly string[];
  messages: readonly LearnerAttemptFeedbackMessage[];
  learnerId?: string;
  instructorId?: string;
  createdAt?: string;
}): InstructorFeedback | undefined {
  if (!input.learnerId) {
    return undefined;
  }

  return {
    id: `${input.scoring.attemptId}-instructor-feedback`,
    attemptId: input.scoring.attemptId,
    learnerId: input.learnerId,
    instructorId: input.instructorId,
    createdAt: input.createdAt ?? new Date(0).toISOString(),
    summary: input.summary,
    strengths: [...input.strengths],
    improvements: [...input.improvements],
    faultIds: uniqueStrings(input.messages.flatMap((message) => message.faultIds)),
    objectiveIds: input.scoring.objectiveScores
      .filter((objective) => !objective.achieved)
      .map((objective) => objective.objectiveId),
    recommendedHintLevel: input.scoring.status === "passed" ? "nudge" : "guided",
    visibility: "learner"
  };
}

export function generateLearnerAttemptFeedback(
  input: GenerateLearnerAttemptFeedbackInput
): LearnerAttemptFeedbackResult {
  const context: FeedbackContext = {
    scoring: input.scoring,
    map: input.map,
    exercise: input.exercise
  };
  const faultMessages = input.scoring.faults.map((fault, index) =>
    messageForFault(fault, context, index + 1)
  );
  const messages = dedupeAndSortMessages(
    faultMessages.length > 0 ? faultMessages : [cleanAttemptMessage(input.scoring)]
  );
  const strengths = cleanAttemptStrengths(input.scoring);
  const improvements = messages
    .filter((message) => message.severity !== "positive")
    .map((message) => message.improvementSuggestion);
  const summary = summaryForResult(input.scoring, messages);

  return {
    attemptId: input.scoring.attemptId,
    summary,
    scorePercent: input.scoring.scorePercent,
    passed: input.scoring.passed,
    status: input.scoring.status,
    messages,
    segmentFeedback: segmentFeedback(input.scoring, messages),
    strengths,
    improvements,
    instructorFeedback: instructorFeedbackForInput({
      scoring: input.scoring,
      summary,
      strengths,
      improvements,
      messages,
      learnerId: input.learnerId,
      instructorId: input.instructorId,
      createdAt: input.createdAt
    })
  };
}
