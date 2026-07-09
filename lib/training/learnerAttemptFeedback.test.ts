import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad, RouteStop } from "../map-engine/index.ts";
import type { DrivingFaultCategory, DrivingFaultSeverity, ExerciseObjective } from "./learnerDriverTraining.ts";
import {
  generateLearnerAttemptFeedback,
  type LearnerFeedbackCategory
} from "./learnerAttemptFeedback.ts";
import type {
  LearnerAttemptRouteSegmentAnnotation,
  LearnerAttemptScoredFault,
  LearnerAttemptScoringResult,
  ScorableLearnerExercise
} from "./learnerAttemptScoring.ts";
import type {
  LearnerRouteValidationResult,
  LearnerRouteValidationRuleCode,
  LearnerRouteValidationSegment
} from "./learnerRouteValidation.ts";

function road(input: {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  name?: string;
  distanceMeters?: number;
}): MapRoad {
  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    distanceMeters: input.distanceMeters ?? 100,
    isOneWay: false,
    name: input.name
  };
}

function feedbackMap(): MapDefinition {
  return {
    id: "phase-7-feedback-map",
    name: "Phase 7 feedback map",
    nodes: [
      { id: "a", x: 0, y: 0, label: "Start" },
      { id: "b", x: 100, y: 0, label: "Decision Junction" },
      { id: "c", x: 200, y: 0, label: "Planned Checkpoint" },
      { id: "d", x: 300, y: 0, label: "Destination" },
      { id: "r", x: 180, y: 80, label: "Roundabout" }
    ],
    roads: [
      road({ id: "road-a-b", fromNodeId: "a", toNodeId: "b", name: "Start Road" }),
      road({ id: "road-one-way", fromNodeId: "b", toNodeId: "c", name: "One Way Street" }),
      road({ id: "road-junction", fromNodeId: "b", toNodeId: "d", name: "Junction Road" }),
      road({ id: "road-roundabout", fromNodeId: "b", toNodeId: "r", name: "Roundabout Approach" }),
      road({ id: "road-recovery", fromNodeId: "r", toNodeId: "c", name: "Recovery Link" }),
      road({ id: "road-c-d", fromNodeId: "c", toNodeId: "d", name: "Finish Road" })
    ],
    restrictions: [],
    landmarks: []
  };
}

function segment(id: string, roadId: string, fromNodeId: string, toNodeId: string): LearnerRouteValidationSegment {
  return {
    id,
    roadId,
    fromNodeId,
    toNodeId
  };
}

function objectives(): ExerciseObjective[] {
  return [
    {
      id: "objective-follow-route",
      title: "Follow the planned route",
      category: "map-reading",
      required: true,
      successCriteria: ["Follow each planned road."],
      linkedFaultCategories: ["map-reading", "unsafe-junction-decision"]
    },
    {
      id: "objective-legality",
      title: "Keep the route legal",
      category: "route-legality",
      required: true,
      successCriteria: ["Avoid restricted or illegal route segments."],
      linkedFaultCategories: ["one-way-direction", "restricted-road", "prohibited-turn", "no-entry"]
    }
  ];
}

function exercise(): ScorableLearnerExercise {
  const checkpoints: RouteStop[] = [
    { type: "node", nodeId: "a", label: "Start" },
    { type: "node", nodeId: "c", label: "Midpoint Checkpoint" },
    { type: "node", nodeId: "d", label: "Destination" }
  ];
  const expectedRouteSegments = [
    segment("expected-1", "road-a-b", "a", "b"),
    segment("expected-2", "road-one-way", "b", "c"),
    segment("expected-3", "road-c-d", "c", "d")
  ];

  return {
    id: "phase-7-feedback-exercise",
    title: "Feedback exercise",
    type: "follow-planned-route",
    difficulty: "beginner",
    mapId: "phase-7-feedback-map",
    objectives: objectives(),
    routeLegs: [],
    routeInstructions: [],
    published: false,
    expectedRouteSegments,
    checkpoints
  };
}

function validationResult(): LearnerRouteValidationResult {
  return {
    status: "valid",
    valid: true,
    blockingErrors: [],
    advisoryWarnings: [],
    affectedRouteSegmentIds: [],
    ruleCodes: [],
    explanation: "Route passes available checks.",
    metrics: {
      routeDistanceMeters: 300,
      estimatedTimeMinutes: 1,
      segmentCount: 3,
      turnCount: 2,
      junctionDecisionCount: 1,
      roundaboutSegmentCount: 0,
      repeatedRoadCount: 0
    }
  };
}

function scoredFault(input: {
  id: string;
  category: DrivingFaultCategory;
  severity: DrivingFaultSeverity;
  title: string;
  detail?: string;
  routeSegmentIds?: string[];
  relatedRoadIds?: string[];
  relatedNodeIds?: string[];
  ruleCodes?: LearnerRouteValidationRuleCode[];
  blocking?: boolean;
}): LearnerAttemptScoredFault {
  return {
    id: input.id,
    attemptId: "feedback-attempt",
    category: input.category,
    severity: input.severity,
    title: input.title,
    detail: input.detail,
    relatedRoadIds: input.relatedRoadIds,
    relatedNodeIds: input.relatedNodeIds,
    source: "system",
    blocking: input.blocking ?? (input.severity === "serious" || input.severity === "dangerous"),
    scorePenalty: input.severity === "dangerous" ? 40 : input.severity === "serious" ? 24 : 6,
    routeSegmentIds: input.routeSegmentIds ?? [],
    ruleCodes: input.ruleCodes
  };
}

function annotation(input: {
  routeSegmentId: string;
  roadId: string;
  faultIds?: string[];
  attemptedSegmentIndex?: number | null;
  status?: LearnerAttemptRouteSegmentAnnotation["status"];
}): LearnerAttemptRouteSegmentAnnotation {
  return {
    routeSegmentId: input.routeSegmentId,
    roadId: input.roadId,
    attemptedSegmentIndex: input.attemptedSegmentIndex ?? 0,
    status: input.status ?? "off-route",
    faultIds: input.faultIds ?? [],
    explanation: "Fixture annotation."
  };
}

function scoringResult(input: {
  faults?: LearnerAttemptScoredFault[];
  annotations?: LearnerAttemptRouteSegmentAnnotation[];
  scorePercent?: number;
  status?: LearnerAttemptScoringResult["status"];
  passed?: boolean;
} = {}): LearnerAttemptScoringResult {
  const faults = input.faults ?? [];
  const minorFaults = faults.filter((fault) => fault.severity === "minor" || fault.severity === "observation");
  const seriousFaults = faults.filter((fault) => fault.severity === "serious");
  const dangerousFaults = faults.filter((fault) => fault.severity === "dangerous");

  return {
    attemptId: "feedback-attempt",
    status: input.status ?? (faults.length > 0 ? "failed" : "passed"),
    passed: input.passed ?? faults.length === 0,
    completed: true,
    totalScore: input.scorePercent ?? (faults.length > 0 ? 68 : 100),
    scorePercent: input.scorePercent ?? (faults.length > 0 ? 68 : 100),
    attemptScore: {
      attemptId: "feedback-attempt",
      scorePercent: input.scorePercent ?? (faults.length > 0 ? 68 : 100),
      passed: input.passed ?? faults.length === 0,
      legalRoute: !faults.some((fault) => fault.blocking),
      objectiveResults: [],
      drivingFaultCount: faults.length,
      seriousFaultCount: seriousFaults.length,
      dangerousFaultCount: dangerousFaults.length,
      reviewStatus: faults.length > 0 ? "fail" : "pass"
    },
    minorFaults,
    seriousFaults,
    dangerousFaults,
    faults,
    objectiveScores: [],
    routeSegmentAnnotations: input.annotations ?? [],
    summaryExplanation: faults.length > 0 ? "Faults recorded." : "Perfect attempt.",
    validation: validationResult(),
    metrics: {
      expectedDistanceMeters: 300,
      attemptedDistanceMeters: faults.length > 0 ? 420 : 300,
      extraDistanceMeters: faults.length > 0 ? 120 : 0,
      efficiencyPercent: faults.length > 0 ? 71.4 : 100,
      routeAdherencePercent: faults.length > 0 ? 75 : 100,
      completedCheckpointCount: 3,
      totalCheckpointCount: 3,
      hintPenalty: faults.some((fault) => /hint/i.test(fault.title)) ? 10 : 0
    }
  };
}

test("feedback engine generates feedback for each supported fault category", () => {
  const faults = [
    scoredFault({
      id: "fault-one-way",
      category: "one-way-direction",
      severity: "serious",
      title: "Wrong-way one-way movement",
      routeSegmentIds: ["seg-one-way"],
      relatedRoadIds: ["road-one-way"],
      ruleCodes: ["wrong-way-one-way"]
    }),
    scoredFault({
      id: "fault-checkpoint",
      category: "missed-checkpoint",
      severity: "serious",
      title: "Missed checkpoint",
      relatedNodeIds: ["c"]
    }),
    scoredFault({
      id: "fault-observation",
      category: "map-reading",
      severity: "observation",
      title: "Road name not checked",
      relatedNodeIds: ["b"]
    }),
    scoredFault({
      id: "fault-junction",
      category: "unsafe-junction-decision",
      severity: "serious",
      title: "Wrong turn not recovered",
      routeSegmentIds: ["seg-junction"],
      relatedRoadIds: ["road-junction"]
    }),
    scoredFault({
      id: "fault-roundabout",
      category: "roundabout-decision",
      severity: "minor",
      title: "Roundabout complexity is high",
      routeSegmentIds: ["seg-roundabout"],
      relatedRoadIds: ["road-roundabout"]
    }),
    scoredFault({
      id: "fault-recovery",
      category: "unsafe-junction-decision",
      severity: "minor",
      title: "Wrong turn recovered",
      detail: "The learner recovered onto the planned route.",
      routeSegmentIds: ["seg-recovery"],
      relatedRoadIds: ["road-recovery"]
    }),
    scoredFault({
      id: "fault-efficiency",
      category: "route-efficiency",
      severity: "minor",
      title: "Small detour"
    }),
    scoredFault({
      id: "fault-hint",
      category: "map-reading",
      severity: "minor",
      title: "Hints used",
      detail: "2 hint(s) used during the attempt."
    })
  ];
  const result = generateLearnerAttemptFeedback({
    scoring: scoringResult({
      faults,
      annotations: [
        annotation({ routeSegmentId: "seg-one-way", roadId: "road-one-way", faultIds: ["fault-one-way"] }),
        annotation({ routeSegmentId: "seg-junction", roadId: "road-junction", faultIds: ["fault-junction"] }),
        annotation({ routeSegmentId: "seg-roundabout", roadId: "road-roundabout", faultIds: ["fault-roundabout"] }),
        annotation({ routeSegmentId: "seg-recovery", roadId: "road-recovery", faultIds: ["fault-recovery"], status: "recovered" })
      ]
    }),
    map: feedbackMap(),
    exercise: exercise()
  });
  const categories = new Set(result.messages.map((message) => message.category));

  assert.deepEqual(categories, new Set<LearnerFeedbackCategory>([
    "legal-validity",
    "route-adherence",
    "observation-planning",
    "junction-handling",
    "roundabout-handling",
    "recovery",
    "efficiency",
    "hint-dependence"
  ]));
  assert.ok(result.segmentFeedback.length >= 4);

  for (const message of result.messages) {
    assert.notEqual(message.whatHappened.trim(), "");
    assert.notEqual(message.whyItMatters.trim(), "");
    assert.notEqual(message.improvementSuggestion.trim(), "");
    assert.doesNotMatch(message.improvementSuggestion, /try again/i);
  }
});

test("feedback engine prioritises serious faults over minor faults", () => {
  const minorHint = scoredFault({
    id: "fault-hint",
    category: "map-reading",
    severity: "minor",
    title: "Hints used"
  });
  const seriousOneWay = scoredFault({
    id: "fault-one-way",
    category: "one-way-direction",
    severity: "serious",
    title: "Wrong-way one-way movement",
    routeSegmentIds: ["seg-one-way"],
    relatedRoadIds: ["road-one-way"],
    ruleCodes: ["wrong-way-one-way"]
  });
  const result = generateLearnerAttemptFeedback({
    scoring: scoringResult({
      faults: [minorHint, seriousOneWay],
      annotations: [
        annotation({ routeSegmentId: "seg-one-way", roadId: "road-one-way", faultIds: ["fault-one-way"] })
      ]
    }),
    map: feedbackMap(),
    exercise: exercise()
  });

  assert.equal(result.messages[0]?.severity, "serious");
  assert.equal(result.messages[0]?.category, "legal-validity");
  assert.equal(result.messages[0]?.whatHappened, "You turned onto a segment marked one-way in the opposite direction.");
});

test("feedback engine gives positive but specific feedback for a clean attempt", () => {
  const result = generateLearnerAttemptFeedback({
    scoring: scoringResult(),
    map: feedbackMap(),
    exercise: exercise(),
    learnerId: "learner-1",
    createdAt: "2026-07-07T10:00:00.000Z"
  });

  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0]?.severity, "positive");
  assert.match(result.summary, /planned route/);
  assert.match(result.messages[0]?.whatHappened ?? "", /planned route/);
  assert.match(result.messages[0]?.whyItMatters ?? "", /checkpoints/);
  assert.doesNotMatch(result.summary, /try again/i);
  assert.equal(result.instructorFeedback?.learnerId, "learner-1");
  assert.equal(result.instructorFeedback?.createdAt, "2026-07-07T10:00:00.000Z");
});

test("feedback engine references route and checkpoint context where available", () => {
  const oneWay = scoredFault({
    id: "fault-one-way",
    category: "one-way-direction",
    severity: "serious",
    title: "Wrong-way one-way movement",
    routeSegmentIds: ["seg-one-way"],
    relatedRoadIds: ["road-one-way"],
    ruleCodes: ["wrong-way-one-way"]
  });
  const checkpoint = scoredFault({
    id: "fault-checkpoint",
    category: "missed-checkpoint",
    severity: "serious",
    title: "Missed checkpoint",
    relatedNodeIds: ["c"]
  });
  const result = generateLearnerAttemptFeedback({
    scoring: scoringResult({
      faults: [oneWay, checkpoint],
      annotations: [
        annotation({
          routeSegmentId: "seg-one-way",
          roadId: "road-one-way",
          faultIds: ["fault-one-way"],
          attemptedSegmentIndex: 1
        })
      ]
    }),
    map: feedbackMap(),
    exercise: exercise()
  });
  const oneWayMessage = result.messages.find((message) => message.faultIds.includes("fault-one-way"));
  const checkpointMessage = result.messages.find((message) => message.faultIds.includes("fault-checkpoint"));

  assert.match(oneWayMessage?.location ?? "", /attempted segment 2/);
  assert.match(oneWayMessage?.location ?? "", /One Way Street/);
  assert.match(checkpointMessage?.location ?? "", /Midpoint Checkpoint/);
  assert.match(checkpointMessage?.improvementSuggestion ?? "", /road name/);
});

test("feedback engine explains checkpoints visited out of order", () => {
  const checkpointOrder = scoredFault({
    id: "fault-checkpoint-order",
    category: "wrong-checkpoint-order",
    severity: "serious",
    title: "Checkpoint visited out of order",
    relatedNodeIds: ["c"]
  });
  const result = generateLearnerAttemptFeedback({
    scoring: scoringResult({
      faults: [checkpointOrder]
    }),
    map: feedbackMap(),
    exercise: exercise()
  });
  const message = result.messages.find((candidate) => candidate.faultIds.includes("fault-checkpoint-order"));

  assert.equal(message?.category, "route-adherence");
  assert.match(message?.whatHappened ?? "", /out of order/);
  assert.match(message?.whyItMatters ?? "", /numbered stop/);
  assert.match(message?.location ?? "", /Midpoint Checkpoint/);
});

test("feedback engine avoids duplicate or contradictory messages", () => {
  const firstFault = scoredFault({
    id: "fault-one-way-1",
    category: "one-way-direction",
    severity: "serious",
    title: "Wrong-way one-way movement",
    routeSegmentIds: ["seg-one-way"],
    relatedRoadIds: ["road-one-way"],
    ruleCodes: ["wrong-way-one-way"]
  });
  const duplicateFault = scoredFault({
    id: "fault-one-way-2",
    category: "one-way-direction",
    severity: "serious",
    title: "Wrong-way one-way movement",
    routeSegmentIds: ["seg-one-way"],
    relatedRoadIds: ["road-one-way"],
    ruleCodes: ["wrong-way-one-way"]
  });
  const result = generateLearnerAttemptFeedback({
    scoring: scoringResult({
      faults: [firstFault, duplicateFault],
      annotations: [
        annotation({
          routeSegmentId: "seg-one-way",
          roadId: "road-one-way",
          faultIds: ["fault-one-way-1", "fault-one-way-2"]
        })
      ]
    }),
    map: feedbackMap(),
    exercise: exercise()
  });

  assert.equal(result.messages.length, 1);
  assert.deepEqual(result.messages[0]?.faultIds, ["fault-one-way-1", "fault-one-way-2"]);
  assert.equal(result.messages[0]?.severity, "serious");
  assert.equal(result.messages.some((message) => message.severity === "positive"), false);
  assert.equal(result.improvements.length, 1);
});
