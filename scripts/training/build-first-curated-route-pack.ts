import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildMapGraph,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  type MapDefinition,
  type MapGraph,
  type RouteStop
} from "../../lib/map-engine/index.ts";
import type {
  ExerciseDifficulty,
  ExerciseType
} from "../../lib/training/learnerDriverTraining.ts";
import type {
  CuratedShortestRouteComparison,
  CuratedShortestRouteComparisonDetail,
  CuratedTrainingRouteCheckpointRequirement,
  CuratedTrainingRouteExport,
  CuratedTrainingRouteMetadata,
  CuratedTrainingRouteStop
} from "../../lib/training/curatedTrainingRoutes.ts";
import {
  validateLearnerRoute,
  type LearnerRouteValidationResult,
  type LearnerRouteValidationSegment
} from "../../lib/training/learnerRouteValidation.ts";
import {
  getRealLondonPilotExerciseMetadata,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap
} from "../../app/dev/route-runner/routeRunnerMaps.ts";

type RoutePackConfig = {
  sourceExerciseId: string;
  routeId: string;
  title: string;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  exerciseType: ExerciseType;
  description: string;
  objective: string;
  skillsPractised: string[];
  expectedLearnerMistakes: string[];
  hintSequence: string[];
  scoringEmphasis: string[];
  instructorFeedbackNotes: string;
  routeChoiceJustification: string;
  instructorQaNote: string;
};

const outputDirectory = path.join(process.cwd(), "data", "training-routes", "complete");
const packId = "real-london-pilot-route-pack-1";
const packVersion = "2026.07";

const routePackConfigs: RoutePackConfig[] = [
  {
    sourceExerciseId: "osm-real-pilot-short-crossing",
    routeId: "real-london-beginner-follow-goodge-tottenham",
    title: "Goodge Street first route-following practice",
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    description: "Short Goodge Street route with a clear start and destination for first route-following practice.",
    objective: "Follow the planned route from Goodge Street to Tottenham Court Road without adding a detour.",
    skillsPractised: ["route following", "road-name confirmation", "basic junction observation"],
    expectedLearnerMistakes: ["wrong turn", "overrunning the destination", "unnecessary detour"],
    hintSequence: [
      "Keep the destination road name in mind before leaving the start.",
      "Look ahead for the next named road change.",
      "Stay with the planned route until the Tottenham Court Road marker."
    ],
    scoringEmphasis: ["route adherence", "simple junction planning", "completion"],
    instructorFeedbackNotes: "Focus feedback on whether the learner held the planned road sequence without overthinking the short route.",
    routeChoiceJustification: "Beginner route is intentionally close to the shortest legal route.",
    instructorQaNote: "Short direct route with low decision load and simple route-following."
  },
  {
    sourceExerciseId: "osm-real-pilot-store-street-short-hop",
    routeId: "real-london-beginner-follow-store-street",
    title: "Store Street short legal connector",
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    description: "Very short Store Street connector used for first-start confidence and endpoint accuracy.",
    objective: "Start accurately, follow the short legal connector, and stop at the destination marker.",
    skillsPractised: ["start accuracy", "destination accuracy", "short-route control"],
    expectedLearnerMistakes: ["wrong start", "wrong destination", "unnecessary detour"],
    hintSequence: [
      "This route is short, so prioritise placing the start correctly.",
      "Check the destination marker before moving away.",
      "Use only the connector shown by the planned route."
    ],
    scoringEmphasis: ["wrong start", "wrong destination", "route adherence"],
    instructorFeedbackNotes: "Use this as a confidence route; feedback should be precise about endpoint placement.",
    routeChoiceJustification: "Short beginner route is deliberately minimal for first-start and stop accuracy.",
    instructorQaNote: "Tiny, controlled route for start/destination accuracy before longer beginner practice."
  },
  {
    sourceExerciseId: "osm-real-pilot-chenies-street-short-hop",
    routeId: "real-london-beginner-follow-chenies-street",
    title: "Chenies Street short route-following practice",
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    description: "Short Chenies Street route using a committed map-backed segment for beginner route-following confidence.",
    objective: "Follow Chenies Street from the west-side start to the Huntley Street-side destination without adding a detour.",
    skillsPractised: ["route following", "endpoint accuracy", "single-street control"],
    expectedLearnerMistakes: ["wrong start", "overrunning the destination", "unnecessary detour"],
    hintSequence: [
      "This is a short single-street route, so confirm the start before moving.",
      "Keep the destination side of Chenies Street in view.",
      "Stay on the planned Chenies Street segment and stop at the marker."
    ],
    scoringEmphasis: ["route adherence", "endpoint accuracy", "efficient completion"],
    instructorFeedbackNotes: "Feedback should focus on whether the learner stayed on the marked Chenies Street segment and stopped accurately.",
    routeChoiceJustification: "Beginner route uses a short legal map-backed segment with no checkpoint or route-choice pressure.",
    instructorQaNote: "Short validated Chenies Street segment for beginner endpoint control."
  },
  {
    sourceExerciseId: "osm-real-pilot-torrington-byng",
    routeId: "real-london-beginner-follow-torrington-byng",
    title: "Torrington Place to Byng Place basics",
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    description: "Short direct route from Torrington Place into Byng Place for basic route-following.",
    objective: "Follow the planned short route and identify the destination without looping back.",
    skillsPractised: ["simple turns", "destination recognition", "route discipline"],
    expectedLearnerMistakes: ["missed destination", "wrong turn", "unnecessary backtracking"],
    hintSequence: [
      "Stay alert for the destination soon after the start.",
      "Confirm the next road before committing to the turn.",
      "Do not loop back unless the planned route shows it."
    ],
    scoringEmphasis: ["route adherence", "efficient completion", "simple turn choice"],
    instructorFeedbackNotes: "Feedback should call out unnecessary backtracking because the route is deliberately short.",
    routeChoiceJustification: "Beginner route is close to the shortest legal path.",
    instructorQaNote: "Short simple route with one clear destination decision."
  },
  {
    sourceExerciseId: "osm-real-pilot-checkpoint-route",
    routeId: "real-london-intermediate-follow-huntley-chenies",
    title: "Huntley Street checkpoint navigation",
    difficulty: "intermediate",
    exerciseType: "follow-planned-route",
    description: "Intermediate route from Huntley Street through Chenies Street checkpoint to Ridgmount Gardens.",
    objective: "Visit the Chenies Street checkpoint in order before finishing at Ridgmount Gardens.",
    skillsPractised: ["checkpoint navigation", "junction observation", "route adherence"],
    expectedLearnerMistakes: ["missed checkpoint", "wrong checkpoint order", "wrong turn"],
    hintSequence: [
      "Check the planned checkpoint before leaving Huntley Street.",
      "Keep Chenies Street as the next required stop.",
      "After the checkpoint, re-orient toward Ridgmount Gardens."
    ],
    scoringEmphasis: ["required checkpoint order", "route adherence", "completion"],
    instructorFeedbackNotes: "Prioritise whether the checkpoint was visited before the destination.",
    routeChoiceJustification: "Checkpoint practice intentionally constrains the route through Chenies Street.",
    instructorQaNote: "Moderate checkpoint route with ordered-stop pressure but a compact footprint."
  },
  {
    sourceExerciseId: "osm-real-pilot-turn-choice",
    routeId: "real-london-intermediate-junction-whitfield-goodge",
    title: "Whitfield Street junction planning",
    difficulty: "intermediate",
    exerciseType: "practise-junction-decision-making",
    description: "Intermediate junction-planning route from Whitfield Street to Goodge Street.",
    objective: "Plan the road changes early and avoid committing to the wrong side street.",
    skillsPractised: ["junction planning", "road-name checking", "wrong-turn recovery"],
    expectedLearnerMistakes: ["wrong turn", "late lane planning", "unnecessary detour"],
    hintSequence: [
      "Look for the next road name before reaching the junction.",
      "Choose the road that keeps you moving toward Goodge Street.",
      "If you miss the turn, recover without adding extra loops."
    ],
    scoringEmphasis: ["junction handling", "route adherence", "efficient recovery"],
    instructorFeedbackNotes: "Feedback should distinguish a wrong turn from a safe recovery after the wrong turn.",
    routeChoiceJustification: "Intermediate route stays close to the shortest legal path while adding decision load.",
    instructorQaNote: "Moderate route with road changes and junction planning without advanced density."
  },
  {
    sourceExerciseId: "osm-real-pilot-one-way-detour",
    routeId: "real-london-intermediate-legal-torrington-one-way",
    title: "Torrington Place legal route choice",
    difficulty: "intermediate",
    exerciseType: "choose-legal-route",
    description: "Intermediate legal-route exercise where the learner must respect available one-way metadata.",
    objective: "Choose the legal route from Torrington Place without reversing a one-way movement.",
    skillsPractised: ["legal route choice", "one-way awareness", "route efficiency"],
    expectedLearnerMistakes: ["one-way direction fault", "illegal shortcut", "unnecessary detour"],
    hintSequence: [
      "Check whether the visually direct route is legal in this direction.",
      "Use the road direction indicators before choosing the next movement.",
      "Follow the legal route even if it is not the visual shortcut."
    ],
    scoringEmphasis: ["legal route validity", "one-way awareness", "route efficiency"],
    instructorFeedbackNotes: "Call out any illegal one-way movement as a serious route-validity issue.",
    routeChoiceJustification: "The legal path is selected from map-backed one-way metadata.",
    instructorQaNote: "Moderate legal-choice route with one-way pressure and a compact route length."
  },
  {
    sourceExerciseId: "osm-real-pilot-gower-to-torrington",
    routeId: "real-london-intermediate-follow-gower-torrington",
    title: "Gower Street to Torrington Place route discipline",
    difficulty: "intermediate",
    exerciseType: "follow-planned-route",
    description: "Intermediate route-following practice from Gower Street into Torrington Place.",
    objective: "Maintain the planned route through several short map segments without unnecessary backtracking.",
    skillsPractised: ["route discipline", "road-name confirmation", "efficient completion"],
    expectedLearnerMistakes: ["wrong turn", "missed destination", "unnecessary backtracking"],
    hintSequence: [
      "Keep checking the route line rather than counting tiny OSM segments.",
      "Confirm the destination side before the final movement.",
      "Avoid reversing unless the planned route requires it."
    ],
    scoringEmphasis: ["route adherence", "efficiency", "completion"],
    instructorFeedbackNotes: "Explain detours in learner terms rather than raw graph segment counts.",
    routeChoiceJustification: "Intermediate route is close to shortest but has more map-segment detail than beginner routes.",
    instructorQaNote: "Moderate route-following task with more graph detail than beginner routes."
  },
  {
    sourceExerciseId: "osm-real-pilot-goodge-chenies-ridgmount",
    routeId: "real-london-intermediate-checkpoint-goodge-chenies",
    title: "Goodge Street checkpoint route",
    difficulty: "intermediate",
    exerciseType: "follow-planned-route",
    description: "Checkpoint route from Goodge Street via Chenies Street to Ridgmount Gardens.",
    objective: "Use the planned checkpoint to stay oriented before finishing the route.",
    skillsPractised: ["checkpoint navigation", "route following", "junction planning"],
    expectedLearnerMistakes: ["missed checkpoint", "wrong checkpoint order", "wrong turn"],
    hintSequence: [
      "Treat Chenies Street as the next required stop.",
      "After the checkpoint, reset your route plan toward Ridgmount Gardens.",
      "If you miss the checkpoint, recover before heading to the finish."
    ],
    scoringEmphasis: ["required checkpoint order", "route adherence", "recovery"],
    instructorFeedbackNotes: "Checkpoint feedback should name whether Chenies Street was missed or reached late.",
    routeChoiceJustification: "Checkpoint practice justifies the required intermediate stop.",
    instructorQaNote: "Longer intermediate checkpoint route with more road changes and recovery risk."
  },
  {
    sourceExerciseId: "osm-real-pilot-longer-route",
    routeId: "real-london-advanced-review-goodge-byng",
    title: "Goodge Street to Byng Place dense route",
    difficulty: "advanced",
    exerciseType: "route-review-mistake-correction",
    description: "Advanced longer dense-network route from Goodge Street to Byng Place.",
    objective: "Complete the longer route, then use review feedback to identify any wrong turns or detours.",
    skillsPractised: ["dense-network navigation", "route review", "detour awareness"],
    expectedLearnerMistakes: ["wrong turn", "unnecessary detour", "missed destination"],
    hintSequence: [
      "Break the route into named-road sections before moving.",
      "Watch for repeated short segments that can hide a wrong turn.",
      "Use the review to identify where any detour began."
    ],
    scoringEmphasis: ["route adherence", "efficiency", "repeated mistakes"],
    instructorFeedbackNotes: "Feedback should prioritise the earliest wrong turn that caused extra distance.",
    routeChoiceJustification: "Advanced route is longer and uses denser map segmentation for route-review practice.",
    instructorQaNote: "Longer dense-network route with many road changes and review value."
  },
  {
    sourceExerciseId: "osm-real-pilot-south-crescent-ridgmount-multistop",
    routeId: "real-london-advanced-follow-south-crescent-ridgmount",
    title: "South Crescent multi-stop navigation",
    difficulty: "advanced",
    exerciseType: "follow-planned-route",
    description: "Advanced multi-stop route through South Crescent and Ridgmount Street before Ridgmount Gardens.",
    objective: "Visit every required stop in order and recover cleanly if a checkpoint is missed.",
    skillsPractised: ["multi-stop planning", "checkpoint order", "recovery"],
    expectedLearnerMistakes: ["missed checkpoint", "wrong checkpoint order", "wrong turn"],
    hintSequence: [
      "Track the next required stop, not only the final destination.",
      "Confirm South Crescent before moving on to Ridgmount Street.",
      "If a stop is missed, recover to the checkpoint order before finishing."
    ],
    scoringEmphasis: ["required checkpoint order", "route adherence", "recovery"],
    instructorFeedbackNotes: "Feedback should separate checkpoint-order errors from ordinary wrong turns.",
    routeChoiceJustification: "Advanced multi-stop route deliberately uses ordered checkpoints.",
    instructorQaNote: "Advanced multi-stop route with ordered checkpoints and recovery risk."
  },
  {
    sourceExerciseId: "osm-real-pilot-tottenham-to-gower-detour",
    routeId: "real-london-advanced-legal-tottenham-gower",
    title: "Tottenham Court Road legal detour",
    difficulty: "advanced",
    exerciseType: "choose-legal-route",
    description: "Advanced legal-route choice from Tottenham Court Road to Gower Street using the available map restrictions.",
    objective: "Choose the legal route even when the visually direct movement is not the right answer.",
    skillsPractised: ["one-way awareness", "legal route choice", "dense-network planning"],
    expectedLearnerMistakes: ["one-way direction fault", "illegal shortcut", "unnecessary detour"],
    hintSequence: [
      "Do not assume the visual shortcut is legal.",
      "Use the direction indicators before committing to the next road.",
      "Follow the legal detour and keep the destination bearing in mind."
    ],
    scoringEmphasis: ["legal route validity", "one-way awareness", "serious fault avoidance"],
    instructorFeedbackNotes: "Illegal one-way movement should be treated as a serious validity issue when supported by data.",
    routeChoiceJustification: "The longer route is justified by available one-way/legal-movement metadata.",
    instructorQaNote: "Advanced legal-choice route with a longer legal path and several decision points."
  },
  {
    sourceExerciseId: "osm-real-pilot-torrington-reverse-loop",
    routeId: "real-london-advanced-legal-torrington-reverse",
    title: "Tottenham Court Road reverse-direction loop",
    difficulty: "advanced",
    exerciseType: "choose-legal-route",
    description: "Advanced one-way-awareness route proving a longer legal loop back to Torrington Place.",
    objective: "Avoid reversing one-way segments and complete the legal loop efficiently.",
    skillsPractised: ["one-way awareness", "route choice", "efficiency under constraints"],
    expectedLearnerMistakes: ["one-way direction fault", "wrong turn", "major detour"],
    hintSequence: [
      "Treat the reverse direction as a legal-route problem.",
      "Look for the permitted loop instead of reversing the obvious road.",
      "Keep the legal loop efficient once you commit to it."
    ],
    scoringEmphasis: ["legal route validity", "route efficiency", "wrong-turn recovery"],
    instructorFeedbackNotes: "Explain why the legal loop matters and where any unnecessary extra distance began.",
    routeChoiceJustification: "The legal reverse-direction path is longer because of one-way restrictions present in map metadata.",
    instructorQaNote: "Advanced route-choice task with one-way pressure and meaningful detour risk."
  },
  {
    sourceExerciseId: "osm-real-pilot-mortimer-goodge-options",
    routeId: "real-london-advanced-junction-mortimer-goodge",
    title: "Mortimer Market dense-network navigation",
    difficulty: "advanced",
    exerciseType: "practise-junction-decision-making",
    description: "Advanced dense-network route from Mortimer Market to Goodge Street with several plausible choices.",
    objective: "Plan through a denser road network and avoid compounding wrong turns.",
    skillsPractised: ["dense-network planning", "junction decisions", "route correction"],
    expectedLearnerMistakes: ["wrong turn", "unnecessary detour", "repeated mistake"],
    hintSequence: [
      "Before each junction, decide which road keeps the route aligned.",
      "Watch for plausible side roads that add distance.",
      "If you take a wrong turn, recover once instead of compounding the error."
    ],
    scoringEmphasis: ["junction handling", "recovery", "efficiency"],
    instructorFeedbackNotes: "Feedback should identify the first poor junction decision and give one recovery suggestion.",
    routeChoiceJustification: "Advanced route has multiple plausible choices and is suitable for dense-network planning.",
    instructorQaNote: "Advanced dense-network route with several road changes and correction opportunities."
  }
];

function stopNodeId(stop: RouteStop): string {
  if (stop.type !== "node") {
    throw new Error("The first curated pack only supports node stops.");
  }

  return stop.nodeId;
}

function validationSegmentsFromEdgeIds(graph: MapGraph, edgeIds: readonly string[]): LearnerRouteValidationSegment[] {
  return edgeIds.map((edgeId) => {
    const edge = graph.edgesById[edgeId];

    if (!edge) {
      throw new Error(`Unknown route edge ${edgeId}.`);
    }

    return {
      id: edge.id,
      roadId: edge.roadId,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId
    };
  });
}

function pointForNode(map: MapDefinition, nodeId: string) {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  if (!node) {
    throw new Error(`Unknown route node ${nodeId}.`);
  }

  return { x: node.x, y: node.y };
}

function roadNameForNode(map: MapDefinition, nodeId: string, fallback: string): string {
  const road = map.roads.find((candidate) => candidate.fromNodeId === nodeId || candidate.toNodeId === nodeId);

  return road?.name?.trim() || fallback;
}

function segmentForStop(
  validationSegments: readonly LearnerRouteValidationSegment[],
  nodeId: string,
  kind: "start" | "checkpoint" | "destination"
): LearnerRouteValidationSegment | undefined {
  if (kind === "start") {
    return validationSegments.find((segment) => segment.fromNodeId === nodeId);
  }

  if (kind === "destination") {
    return validationSegments.find((segment) => segment.toNodeId === nodeId);
  }

  return validationSegments.find((segment) => segment.toNodeId === nodeId) ??
    validationSegments.find((segment) => segment.fromNodeId === nodeId);
}

function curatedStop(input: {
  map: MapDefinition;
  nodeId: string;
  label: string;
  kind: "start" | "checkpoint" | "destination";
  order: number;
  required: boolean;
  validationSegments: readonly LearnerRouteValidationSegment[];
}): CuratedTrainingRouteStop {
  const segment = segmentForStop(input.validationSegments, input.nodeId, input.kind);

  return {
    id: `${input.kind}-${String(input.order).padStart(2, "0")}`,
    kind: input.kind,
    order: input.order,
    nodeId: input.nodeId,
    label: input.label,
    point: pointForNode(input.map, input.nodeId),
    roadId: segment?.roadId ?? roadNameForNode(input.map, input.nodeId, input.label),
    routeSegmentId: segment?.id,
    required: input.required,
    display: {
      markerLabel:
        input.kind === "start" ? "START" : input.kind === "destination" ? "DESTINATION" : String(input.order),
      markerRole: input.kind,
      description:
        input.kind === "start"
          ? `Start at ${input.label}.`
          : input.kind === "destination"
            ? `Finish at ${input.label}.`
            : `Checkpoint ${input.order}: ${input.label}.`
    }
  };
}

function validationMetricsForRoute(
  map: MapDefinition,
  routeSegments: readonly LearnerRouteValidationSegment[],
  difficulty: Exclude<ExerciseDifficulty, "easy">
): LearnerRouteValidationResult {
  return validateLearnerRoute({
    map,
    routeSegments,
    difficulty
  });
}

function comparisonDetail(input: {
  authoredValidation: LearnerRouteValidationResult;
  shortestValidation: LearnerRouteValidationResult;
  shortestDistanceMeters: number;
  shortestEdgeIds: readonly string[];
}): CuratedShortestRouteComparisonDetail {
  const shortestLength = Math.max(1, input.shortestDistanceMeters);
  const lengthDelta = input.authoredValidation.metrics.routeDistanceMeters - shortestLength;
  const percentageLonger = Math.round((lengthDelta / shortestLength) * 1000) / 10;
  const verdict =
    percentageLonger >= 50
      ? "major-detour-warning"
      : percentageLonger >= 25
        ? "detour-warning"
        : percentageLonger > 10
          ? "acceptable-training-variation"
          : "shortest-or-near-shortest";

  return {
    comparisonStatus: "available",
    verdict,
    explanation: `The authored route is ${percentageLonger}% longer than the shortest legal route for this comparison.`,
    authoredLengthMeters: Math.round(input.authoredValidation.metrics.routeDistanceMeters),
    shortestLengthMeters: Math.round(input.shortestDistanceMeters),
    lengthDeltaMeters: Math.round(lengthDelta),
    percentageLonger,
    authoredSegmentCount: input.authoredValidation.metrics.segmentCount,
    shortestSegmentCount: input.shortestValidation.metrics.segmentCount,
    segmentCountDelta: input.authoredValidation.metrics.segmentCount - input.shortestValidation.metrics.segmentCount,
    authoredTurnCount: input.authoredValidation.metrics.turnCount,
    shortestTurnCount: input.shortestValidation.metrics.turnCount,
    turnCountDelta: input.authoredValidation.metrics.turnCount - input.shortestValidation.metrics.turnCount,
    authoredDecisionPointCount: input.authoredValidation.metrics.junctionDecisionCount,
    shortestDecisionPointCount: input.shortestValidation.metrics.junctionDecisionCount,
    decisionPointDelta:
      input.authoredValidation.metrics.junctionDecisionCount - input.shortestValidation.metrics.junctionDecisionCount,
    shortestRouteSegmentIds: [...input.shortestEdgeIds]
  };
}

function unknownComparison(explanation: string): CuratedShortestRouteComparisonDetail {
  return {
    comparisonStatus: "unknown",
    verdict: "unknown",
    explanation,
    authoredLengthMeters: null,
    shortestLengthMeters: null,
    lengthDeltaMeters: null,
    percentageLonger: null,
    authoredSegmentCount: null,
    shortestSegmentCount: null,
    segmentCountDelta: null,
    authoredTurnCount: null,
    shortestTurnCount: null,
    turnCountDelta: null,
    authoredDecisionPointCount: null,
    shortestDecisionPointCount: null,
    decisionPointDelta: null,
    shortestRouteSegmentIds: []
  };
}

function notApplicableComparison(explanation: string): CuratedShortestRouteComparisonDetail {
  return {
    ...unknownComparison(explanation),
    comparisonStatus: "not-applicable"
  };
}

function buildShortestComparison(input: {
  map: MapDefinition;
  graph: MapGraph;
  stopNodeIds: readonly string[];
  authoredValidation: LearnerRouteValidationResult;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  routeChoiceJustification: string;
}): CuratedShortestRouteComparison {
  const directRoute = findShortestLegalRoute({
    graph: input.graph,
    startNodeId: input.stopNodeIds[0],
    endNodeId: input.stopNodeIds[input.stopNodeIds.length - 1],
    restrictions: input.map.restrictions
  });
  const directComparison = directRoute.found
    ? comparisonDetail({
        authoredValidation: input.authoredValidation,
        shortestValidation: validationMetricsForRoute(
          input.map,
          validationSegmentsFromEdgeIds(input.graph, directRoute.edgeIds),
          input.difficulty
        ),
        shortestDistanceMeters: directRoute.distanceMeters,
        shortestEdgeIds: directRoute.edgeIds
      })
    : unknownComparison("No direct legal shortest route can be proven from the available map graph.");
  const checkpointRoute =
    input.stopNodeIds.length > 2
      ? findShortestLegalRouteThroughStops({
          graph: input.graph,
          stopNodeIds: [...input.stopNodeIds],
          restrictions: input.map.restrictions
        })
      : null;
  const checkpointConstrainedComparison = checkpointRoute
    ? checkpointRoute.found
      ? comparisonDetail({
          authoredValidation: input.authoredValidation,
          shortestValidation: validationMetricsForRoute(
            input.map,
            validationSegmentsFromEdgeIds(input.graph, checkpointRoute.edgeIds),
            input.difficulty
          ),
          shortestDistanceMeters: checkpointRoute.distanceMeters,
          shortestEdgeIds: checkpointRoute.edgeIds
        })
      : unknownComparison("No checkpoint-constrained legal shortest route can be proven from the available map graph.")
    : notApplicableComparison("Checkpoint-constrained comparison is not needed because this route has no intermediate checkpoints.");
  const requiresRouteChoiceJustification = [directComparison, checkpointConstrainedComparison].some(
    (comparison) => comparison.verdict === "detour-warning" || comparison.verdict === "major-detour-warning"
  );

  return {
    directComparison,
    checkpointConstrainedComparison,
    routeChoiceJustification: input.routeChoiceJustification,
    requiresRouteChoiceJustification,
    guidance: [
      "Beginner curated routes should usually stay close to the shortest legal route.",
      "Checkpoint routes should be judged against the checkpoint-constrained comparison.",
      "Legal route-choice routes may be longer only when map metadata supports the restriction or one-way constraint."
    ]
  };
}

function estimatedDifficultyForMetrics(
  metrics: LearnerRouteValidationResult["metrics"],
  selectedDifficulty: Exclude<ExerciseDifficulty, "easy">
): ExerciseDifficulty {
  if (metrics.routeDistanceMeters >= 360 || metrics.segmentCount >= 26 || metrics.junctionDecisionCount >= 2) {
    return "advanced";
  }

  if (metrics.routeDistanceMeters >= 140 || metrics.segmentCount >= 9 || metrics.junctionDecisionCount >= 1) {
    return "intermediate";
  }

  return selectedDifficulty;
}

function checkpointRequirements(input: {
  checkpoints: readonly string[];
  objective: string;
}): CuratedTrainingRouteCheckpointRequirement {
  const required = input.checkpoints.length > 0;

  return {
    required,
    ordered: true,
    checkpointCount: input.checkpoints.length,
    requiredNodeIds: [...input.checkpoints],
    instruction: required
      ? "Visit every numbered checkpoint in order before the destination."
      : "No intermediate checkpoints are required for this route."
  };
}

function makeRouteExport(config: RoutePackConfig): CuratedTrainingRouteExport {
  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const exercise = realLondonOsmPilotRouteExercises.find((candidate) => candidate.id === config.sourceExerciseId);

  if (!exercise) {
    throw new Error(`Unknown source exercise ${config.sourceExerciseId}.`);
  }

  const stopNodeIds = exercise.stops.map(stopNodeId);
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: map.restrictions
  });

  if (!route.found) {
    throw new Error(`No legal route found for ${config.routeId}: ${route.reason}.`);
  }

  const validationSegments = validationSegmentsFromEdgeIds(graph, route.edgeIds);
  const validation = validationMetricsForRoute(map, validationSegments, config.difficulty);
  const sourceMetadata = getRealLondonPilotExerciseMetadata(exercise);
  const checkpointNodeIds = stopNodeIds.slice(1, -1);
  const metadata: CuratedTrainingRouteMetadata = {
    routeId: config.routeId,
    title: config.title,
    area: "Real London Pilot",
    practiceMapId: map.id,
    areaId: map.id,
    areaName: "Real London Pilot",
    sourceFixture: "realLondonPilotOverpass.json",
    difficulty: config.difficulty,
    exerciseType: config.exerciseType,
    description: config.description,
    objective: config.objective,
    skillsPractised: config.skillsPractised,
    expectedLearnerMistakes: config.expectedLearnerMistakes,
    hintSequence: config.hintSequence,
    scoringEmphasis: config.scoringEmphasis,
    instructorFeedbackNotes: config.instructorFeedbackNotes,
    routeChoiceJustification: config.routeChoiceJustification,
    status: "beta"
  };
  const checkpoints = checkpointNodeIds.map((nodeId, index) =>
    curatedStop({
      map,
      nodeId,
      label: exercise.stops[index + 1]?.label ?? `Checkpoint ${index + 1}`,
      kind: "checkpoint",
      order: index + 1,
      required: true,
      validationSegments
    })
  );
  const requirements = checkpointRequirements({
    checkpoints: checkpointNodeIds,
    objective: config.objective
  });
  const shortestRouteComparison = buildShortestComparison({
    map,
    graph,
    stopNodeIds,
    authoredValidation: validation,
    difficulty: config.difficulty,
    routeChoiceJustification: config.routeChoiceJustification
  });
  const estimatedDifficulty = estimatedDifficultyForMetrics(validation.metrics, config.difficulty);
  const warnings = [
    ...validation.advisoryWarnings.map((warning) => warning.explanation),
    ...(estimatedDifficulty !== config.difficulty
      ? [`Route metrics currently estimate ${estimatedDifficulty} difficulty because the OSM graph is highly segmented.`]
      : [])
  ];

  return {
    schemaVersion: 1,
    routeId: config.routeId,
    title: config.title,
    area: metadata.area,
    practiceMapId: metadata.practiceMapId,
    areaId: metadata.areaId,
    areaName: metadata.areaName,
    sourceFixture: metadata.sourceFixture,
    difficulty: config.difficulty,
    exerciseType: config.exerciseType,
    status: "beta",
    saveMode: "complete-route",
    lifecycleStage: "complete",
    metadata,
    mapId: map.id,
    mapVersion: map.mapVersion ?? map.version,
    sourceRouteExerciseId: exercise.id,
    sourceRouteExerciseVersion: exercise.exerciseVersion,
    start: curatedStop({
      map,
      nodeId: stopNodeIds[0],
      label: exercise.stops[0]?.label ?? "Start",
      kind: "start",
      order: 0,
      required: true,
      validationSegments
    }),
    destination: curatedStop({
      map,
      nodeId: stopNodeIds[stopNodeIds.length - 1],
      label: exercise.stops[exercise.stops.length - 1]?.label ?? "Destination",
      kind: "destination",
      order: checkpointNodeIds.length + 1,
      required: true,
      validationSegments
    }),
    checkpoints,
    checkpointRequirements: requirements,
    routeSegmentIds: validationSegments.map((segment) => segment.id),
    roadIds: [...new Set(validationSegments.map((segment) => segment.roadId))],
    nodeIds: route.nodeIds,
    routeGeometry: route.nodeIds.map((nodeId) => pointForNode(map, nodeId)),
    validationSummary: {
      status: validation.status,
      valid: validation.valid,
      blockingErrors: validation.blockingErrors,
      advisoryWarnings: validation.advisoryWarnings,
      affectedRouteSegmentIds: validation.affectedRouteSegmentIds,
      ruleCodes: validation.ruleCodes,
      explanation: validation.explanation
    },
    complexitySummary: {
      approximateRouteLengthMeters: Math.round(validation.metrics.routeDistanceMeters),
      segmentCount: validation.metrics.segmentCount,
      turnCount: validation.metrics.turnCount,
      decisionPointCount: validation.metrics.junctionDecisionCount,
      checkpointCount: checkpoints.length,
      estimatedDifficulty,
      warnings: [...new Set(warnings)]
    },
    shortestRouteComparison,
    validationSegments,
    instructorQaNote: config.instructorQaNote,
    learnerCard: {
      area: metadata.areaName,
      approximateLengthMeters: Math.round(validation.metrics.routeDistanceMeters),
      segmentCount: validation.metrics.segmentCount,
      turnCount: validation.metrics.turnCount,
      decisionPointCount: validation.metrics.junctionDecisionCount,
      checkpointCount: checkpoints.length,
      skillsPractised: [...config.skillsPractised],
      statusLabel: "Beta"
    },
    routePack: {
      packId,
      packVersion,
      sourceExerciseDifficulty: sourceMetadata?.difficulty ?? exercise.difficulty ?? "unknown",
      sourceRouteType: sourceMetadata?.routeType ?? "direct",
      manualQaNote: config.instructorQaNote,
      knownLimitations: [
        "Legal restrictions are only enforced where present in committed map metadata.",
        "OSM-derived roads can be split into many graph segments, so segment count can overstate learner-facing turn count."
      ]
    }
  };
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  const routes = routePackConfigs.map(makeRouteExport);
  const invalidRoutes = routes.filter((route) => !route.validationSummary.valid || route.validationSummary.blockingErrors.length > 0);

  if (invalidRoutes.length > 0) {
    throw new Error(`Curated route pack contains invalid route(s): ${invalidRoutes.map((route) => route.routeId).join(", ")}`);
  }

  await Promise.all(
    routes.map((route) =>
      writeFile(path.join(outputDirectory, `${route.routeId}.json`), `${JSON.stringify(route, null, 2)}\n`, "utf8")
    )
  );

  console.log(`Wrote ${routes.length} curated learner route(s) to ${path.relative(process.cwd(), outputDirectory)}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
