import type { MapDefinition } from "../map-engine/index.ts";
import {
  type DrivingFaultCategory,
  type ExerciseDifficulty,
  type ExerciseObjective,
  type ExerciseObjectiveCategory,
  type ExerciseType,
  type LearnerExercise,
  isExerciseDifficulty,
  isExerciseType
} from "./learnerDriverTraining.ts";
import {
  generateLearnerExercise,
  type GenerateLearnerExerciseInput,
  type GeneratedLearnerExercise,
  type LearnerExerciseGenerationAttempt,
  type LearnerExerciseGenerationReasonCode,
  type LearnerExerciseGenerationStatus,
  type LearnerExerciseTargetBounds
} from "./learnerExerciseGeneration.ts";
import {
  scoreLearnerAttempt,
  type LearnerAttemptScoringResult,
  type ScorableLearnerExercise,
  type ScoreLearnerAttemptInput
} from "./learnerAttemptScoring.ts";
import {
  generateLearnerHint,
  type GenerateLearnerHintInput,
  type LearnerHintFallback,
  type LearnerHintGenerationResult,
  type LearnerProgressiveHint
} from "./learnerProgressiveHints.ts";
import type {
  LearnerRouteValidationConstraints,
  LearnerRouteValidationResult
} from "./learnerRouteValidation.ts";

export const LEARNER_SCENARIO_TEMPLATE_IDS = [
  "first-route-following-practice",
  "simple-left-right-turn-sequence",
  "roundabout-introduction",
  "missed-turn-recovery",
  "choose-the-legal-route",
  "junction-planning",
  "one-way-awareness",
  "checkpoint-navigation",
  "route-review-challenge",
  "advanced-dense-network-navigation",
  "advanced-multi-decision-route"
] as const;

export type LearnerScenarioTemplateId = (typeof LEARNER_SCENARIO_TEMPLATE_IDS)[number];

export const LEARNER_SCENARIO_SCORING_EMPHASES = [
  "route-adherence",
  "legal-validity",
  "checkpoint-ordering",
  "junction-planning",
  "roundabout-handling",
  "recovery",
  "efficiency",
  "hint-independence"
] as const;

export type LearnerScenarioScoringEmphasis = (typeof LEARNER_SCENARIO_SCORING_EMPHASES)[number];

export const LEARNER_SCENARIO_HINT_STYLES = [
  "confidence-building",
  "directional-sequence",
  "roundabout-planning",
  "recovery-coaching",
  "legal-reasoning",
  "junction-planning",
  "checkpoint-led",
  "review-led",
  "low-disclosure"
] as const;

export type LearnerScenarioHintStyle = (typeof LEARNER_SCENARIO_HINT_STYLES)[number];

export type LearnerScenarioFeedbackEmphasis =
  | "legal-validity"
  | "route-adherence"
  | "observation-planning"
  | "junction-handling"
  | "roundabout-handling"
  | "recovery"
  | "efficiency"
  | "hint-dependence";

export type LearnerScenarioGenerationConstraints = LearnerRouteValidationConstraints & {
  targetAreaBounds?: LearnerExerciseTargetBounds;
  maxAttempts?: number;
};

export type LearnerScenarioTemplate = {
  id: LearnerScenarioTemplateId;
  title: string;
  exerciseType: ExerciseType;
  targetDifficulty: ExerciseDifficulty;
  objectiveText: string;
  objectiveCategory: ExerciseObjectiveCategory;
  generationConstraints: LearnerScenarioGenerationConstraints;
  scoringEmphasis: LearnerScenarioScoringEmphasis[];
  hintStyle: LearnerScenarioHintStyle;
  feedbackEmphasis: LearnerScenarioFeedbackEmphasis[];
  tags: string[];
};

export type LearnerScenarioMetadata = {
  templateId: LearnerScenarioTemplateId;
  title: string;
  objectiveText: string;
  scoringEmphasis: LearnerScenarioScoringEmphasis[];
  hintStyle: LearnerScenarioHintStyle;
  feedbackEmphasis: LearnerScenarioFeedbackEmphasis[];
};

export type LearnerScenarioExercise<TExercise extends LearnerExercise = GeneratedLearnerExercise> = TExercise & {
  scenarioMetadata: LearnerScenarioMetadata;
};

export type GeneratedLearnerScenarioExercise = LearnerScenarioExercise<GeneratedLearnerExercise>;

export type GenerateLearnerScenarioExerciseInput = Omit<
  GenerateLearnerExerciseInput,
  "difficulty" | "exerciseType" | "constraints" | "targetAreaBounds"
> & {
  scenarioId?: LearnerScenarioTemplateId;
  scenarioTemplate?: LearnerScenarioTemplate;
  constraints?: LearnerRouteValidationConstraints;
  targetAreaBounds?: LearnerExerciseTargetBounds;
};

export type LearnerScenarioGenerationResult =
  | {
      status: Exclude<LearnerExerciseGenerationStatus, "failed">;
      scenarioTemplate: LearnerScenarioTemplate;
      exercise: GeneratedLearnerScenarioExercise;
      validation: LearnerRouteValidationResult;
      attempts: LearnerExerciseGenerationAttempt[];
      reasonCodes: LearnerExerciseGenerationReasonCode[];
      explanation: string;
    }
  | {
      status: "failed";
      scenarioTemplate: LearnerScenarioTemplate;
      exercise: null;
      validation: null;
      attempts: LearnerExerciseGenerationAttempt[];
      reasonCodes: LearnerExerciseGenerationReasonCode[];
      explanation: string;
    };

export type LearnerScenarioValidationResult = {
  valid: boolean;
  errors: string[];
};

export type LearnerScenarioScoringDetail = {
  scenarioId: LearnerScenarioTemplateId;
  emphasis: LearnerScenarioScoringEmphasis;
  label: string;
  objectiveId: string;
  scorePercent: number;
  achieved: boolean;
  faultIds: string[];
  explanation: string;
};

export type LearnerScenarioAttemptScoringResult = LearnerAttemptScoringResult & {
  scenarioScoringDetails: LearnerScenarioScoringDetail[];
};

export type ScoreLearnerScenarioAttemptInput = Omit<ScoreLearnerAttemptInput, "exercise"> & {
  exercise: ScorableLearnerExercise | GeneratedLearnerExercise;
  scenarioId?: LearnerScenarioTemplateId;
  scenarioTemplate?: LearnerScenarioTemplate;
};

export type GenerateLearnerScenarioHintInput = GenerateLearnerHintInput & {
  scenarioId?: LearnerScenarioTemplateId;
  scenarioTemplate?: LearnerScenarioTemplate;
};

export type LearnerScenarioHintGenerationResult =
  | {
      status: "generated";
      scenarioTemplate: LearnerScenarioTemplate;
      hint: LearnerProgressiveHint;
      fallback: null;
      attemptEvent?: Extract<LearnerHintGenerationResult, { status: "generated" }>["attemptEvent"];
      explanation: string;
    }
  | {
      status: "fallback";
      scenarioTemplate: LearnerScenarioTemplate;
      hint: null;
      fallback: LearnerHintFallback;
      attemptEvent?: undefined;
      explanation: string;
    };

const scoringEmphasisLabels: Record<LearnerScenarioScoringEmphasis, string> = {
  "route-adherence": "Route adherence",
  "legal-validity": "Legal validity",
  "checkpoint-ordering": "Checkpoint ordering",
  "junction-planning": "Junction planning",
  "roundabout-handling": "Roundabout handling",
  recovery: "Recovery",
  efficiency: "Efficiency",
  "hint-independence": "Hint independence"
};

const faultCategoriesByScoringEmphasis: Record<LearnerScenarioScoringEmphasis, DrivingFaultCategory[]> = {
  "route-adherence": ["wrong-start", "wrong-destination", "route-drawing", "unsafe-junction-decision"],
  "legal-validity": ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road"],
  "checkpoint-ordering": ["missed-checkpoint", "wrong-checkpoint-order", "wrong-start", "wrong-destination"],
  "junction-planning": ["unsafe-junction-decision", "map-reading"],
  "roundabout-handling": ["roundabout-decision"],
  recovery: ["unsafe-junction-decision", "route-efficiency"],
  efficiency: ["route-efficiency"],
  "hint-independence": ["map-reading"]
};

const objectiveCategoryByScoringEmphasis: Record<LearnerScenarioScoringEmphasis, ExerciseObjectiveCategory> = {
  "route-adherence": "map-reading",
  "legal-validity": "route-legality",
  "checkpoint-ordering": "checkpoint-ordering",
  "junction-planning": "junction-decision",
  "roundabout-handling": "roundabout-control",
  recovery: "mistake-correction",
  efficiency: "route-efficiency",
  "hint-independence": "map-reading"
};

const hintStylePrompts: Record<LearnerScenarioHintStyle, string> = {
  "confidence-building": "Confidence cue: confirm the next planned road before moving.",
  "directional-sequence": "Direction sequence: think road by road, then commit to the next turn.",
  "roundabout-planning": "Roundabout plan: count the intended exit before entering.",
  "recovery-coaching": "Recovery plan: return to the planned route at the next safe legal connection.",
  "legal-reasoning": "Legal check: compare the allowed movement with the route before committing.",
  "junction-planning": "Junction plan: identify the target road, then check the available outgoing roads.",
  "checkpoint-led": "Checkpoint check: keep the next required checkpoint in order.",
  "review-led": "Review cue: use the previous mistake to decide what must change next.",
  "low-disclosure": "Low-disclosure cue: solve the next decision before asking for a specific action."
};

function scenarioConstraints(input: LearnerScenarioGenerationConstraints): LearnerRouteValidationConstraints {
  return {
    minDistanceMeters: input.minDistanceMeters,
    maxDistanceMeters: input.maxDistanceMeters,
    maxEstimatedTimeMinutes: input.maxEstimatedTimeMinutes,
    averageSpeedKmh: input.averageSpeedKmh,
    maxSegmentCount: input.maxSegmentCount,
    maxTurnCount: input.maxTurnCount,
    maxJunctionDecisionCount: input.maxJunctionDecisionCount,
    maxRoundaboutSegmentCount: input.maxRoundaboutSegmentCount,
    maxRepeatedRoadCount: input.maxRepeatedRoadCount
  };
}

export const LEARNER_SCENARIO_TEMPLATES: LearnerScenarioTemplate[] = [
  {
    id: "first-route-following-practice",
    title: "First route-following practice",
    exerciseType: "follow-planned-route",
    targetDifficulty: "beginner",
    objectiveText: "Follow a short planned route from start to destination without leaving the instructed roads.",
    objectiveCategory: "map-reading",
    generationConstraints: {
      minDistanceMeters: 80,
      maxDistanceMeters: 650,
      maxEstimatedTimeMinutes: 5,
      maxSegmentCount: 4,
      maxTurnCount: 3,
      maxJunctionDecisionCount: 2,
      maxRoundaboutSegmentCount: 0,
      maxRepeatedRoadCount: 0,
      maxAttempts: 80
    },
    scoringEmphasis: ["route-adherence", "hint-independence"],
    hintStyle: "confidence-building",
    feedbackEmphasis: ["route-adherence", "observation-planning", "hint-dependence"],
    tags: ["first-practice", "short-route"]
  },
  {
    id: "simple-left-right-turn-sequence",
    title: "Simple left/right turn sequence",
    exerciseType: "identify-next-safe-turn",
    targetDifficulty: "easy",
    objectiveText: "Practise a short sequence of left and right decisions while staying on the planned route.",
    objectiveCategory: "junction-decision",
    generationConstraints: {
      minDistanceMeters: 140,
      maxDistanceMeters: 900,
      maxEstimatedTimeMinutes: 7,
      maxSegmentCount: 6,
      maxTurnCount: 5,
      maxJunctionDecisionCount: 4,
      maxRoundaboutSegmentCount: 0,
      maxRepeatedRoadCount: 0,
      maxAttempts: 90
    },
    scoringEmphasis: ["junction-planning", "route-adherence"],
    hintStyle: "directional-sequence",
    feedbackEmphasis: ["junction-handling", "route-adherence"],
    tags: ["turn-sequence", "simple-junctions"]
  },
  {
    id: "roundabout-introduction",
    title: "Roundabout introduction",
    exerciseType: "practise-roundabouts",
    targetDifficulty: "easy",
    objectiveText: "Introduce roundabout planning where the map data exposes suitable roundabout segments.",
    objectiveCategory: "roundabout-control",
    generationConstraints: {
      minDistanceMeters: 180,
      maxDistanceMeters: 1100,
      maxEstimatedTimeMinutes: 8,
      maxSegmentCount: 7,
      maxTurnCount: 5,
      maxJunctionDecisionCount: 5,
      maxRoundaboutSegmentCount: 1,
      maxRepeatedRoadCount: 0,
      maxAttempts: 90
    },
    scoringEmphasis: ["roundabout-handling", "junction-planning"],
    hintStyle: "roundabout-planning",
    feedbackEmphasis: ["roundabout-handling", "observation-planning"],
    tags: ["roundabout", "introduction"]
  },
  {
    id: "missed-turn-recovery",
    title: "Missed-turn recovery",
    exerciseType: "route-review-mistake-correction",
    targetDifficulty: "intermediate",
    objectiveText: "Recover from a missed turn by rejoining the planned route without adding avoidable distance.",
    objectiveCategory: "mistake-correction",
    generationConstraints: {
      minDistanceMeters: 300,
      maxDistanceMeters: 1800,
      maxEstimatedTimeMinutes: 13,
      maxSegmentCount: 10,
      maxTurnCount: 8,
      maxJunctionDecisionCount: 7,
      maxRoundaboutSegmentCount: 1,
      maxRepeatedRoadCount: 1,
      maxAttempts: 110
    },
    scoringEmphasis: ["recovery", "efficiency", "route-adherence"],
    hintStyle: "recovery-coaching",
    feedbackEmphasis: ["recovery", "efficiency", "route-adherence"],
    tags: ["recovery", "mistake-correction"]
  },
  {
    id: "choose-the-legal-route",
    title: "Choose the legal route",
    exerciseType: "choose-legal-route",
    targetDifficulty: "intermediate",
    objectiveText: "Choose a legal route using only restrictions that are present in the map data.",
    objectiveCategory: "route-legality",
    generationConstraints: {
      minDistanceMeters: 300,
      maxDistanceMeters: 2200,
      maxEstimatedTimeMinutes: 15,
      maxSegmentCount: 12,
      maxTurnCount: 9,
      maxJunctionDecisionCount: 8,
      maxRoundaboutSegmentCount: 1,
      maxRepeatedRoadCount: 1,
      maxAttempts: 120
    },
    scoringEmphasis: ["legal-validity", "junction-planning"],
    hintStyle: "legal-reasoning",
    feedbackEmphasis: ["legal-validity", "junction-handling"],
    tags: ["legal-route", "restrictions"]
  },
  {
    id: "junction-planning",
    title: "Junction planning",
    exerciseType: "practise-junction-decision-making",
    targetDifficulty: "intermediate",
    objectiveText: "Plan each junction decision before committing to the next road.",
    objectiveCategory: "junction-decision",
    generationConstraints: {
      minDistanceMeters: 280,
      maxDistanceMeters: 2000,
      maxEstimatedTimeMinutes: 14,
      maxSegmentCount: 11,
      maxTurnCount: 9,
      maxJunctionDecisionCount: 8,
      maxRoundaboutSegmentCount: 1,
      maxRepeatedRoadCount: 1,
      maxAttempts: 120
    },
    scoringEmphasis: ["junction-planning", "route-adherence"],
    hintStyle: "junction-planning",
    feedbackEmphasis: ["junction-handling", "observation-planning", "route-adherence"],
    tags: ["junctions", "planning"]
  },
  {
    id: "one-way-awareness",
    title: "One-way awareness",
    exerciseType: "choose-legal-route",
    targetDifficulty: "intermediate",
    objectiveText: "Practise choosing a route where mapped one-way or restriction context may influence the legal path.",
    objectiveCategory: "route-legality",
    generationConstraints: {
      minDistanceMeters: 420,
      maxDistanceMeters: 2600,
      maxEstimatedTimeMinutes: 16,
      maxSegmentCount: 15,
      maxTurnCount: 11,
      maxJunctionDecisionCount: 9,
      maxRoundaboutSegmentCount: 1,
      maxRepeatedRoadCount: 1,
      maxAttempts: 150
    },
    scoringEmphasis: ["legal-validity", "junction-planning", "route-adherence"],
    hintStyle: "legal-reasoning",
    feedbackEmphasis: ["legal-validity", "junction-handling", "observation-planning"],
    tags: ["one-way-awareness", "legal-route", "restrictions"]
  },
  {
    id: "checkpoint-navigation",
    title: "Checkpoint navigation",
    exerciseType: "follow-planned-route",
    targetDifficulty: "intermediate",
    objectiveText: "Navigate through the route checkpoints in order before reaching the destination.",
    objectiveCategory: "checkpoint-ordering",
    generationConstraints: {
      minDistanceMeters: 320,
      maxDistanceMeters: 2200,
      maxEstimatedTimeMinutes: 15,
      maxSegmentCount: 12,
      maxTurnCount: 9,
      maxJunctionDecisionCount: 8,
      maxRoundaboutSegmentCount: 1,
      maxRepeatedRoadCount: 1,
      maxAttempts: 120
    },
    scoringEmphasis: ["checkpoint-ordering", "route-adherence"],
    hintStyle: "checkpoint-led",
    feedbackEmphasis: ["route-adherence", "observation-planning"],
    tags: ["checkpoints", "navigation"]
  },
  {
    id: "route-review-challenge",
    title: "Route review challenge",
    exerciseType: "route-review-mistake-correction",
    targetDifficulty: "advanced",
    objectiveText: "Use route review feedback to correct legality, adherence, and efficiency mistakes.",
    objectiveCategory: "mistake-correction",
    generationConstraints: {
      minDistanceMeters: 900,
      maxDistanceMeters: 6200,
      maxEstimatedTimeMinutes: 30,
      maxSegmentCount: 28,
      maxTurnCount: 22,
      maxJunctionDecisionCount: 18,
      maxRoundaboutSegmentCount: 3,
      maxRepeatedRoadCount: 2,
      maxAttempts: 220
    },
    scoringEmphasis: ["legal-validity", "recovery", "efficiency"],
    hintStyle: "review-led",
    feedbackEmphasis: ["legal-validity", "recovery", "efficiency"],
    tags: ["route-review", "mistake-correction", "advanced"]
  },
  {
    id: "advanced-dense-network-navigation",
    title: "Advanced dense-network navigation",
    exerciseType: "choose-legal-route",
    targetDifficulty: "advanced",
    objectiveText: "Navigate a denser road network while balancing legality, junction planning, and route efficiency.",
    objectiveCategory: "route-legality",
    generationConstraints: {
      minDistanceMeters: 1000,
      maxDistanceMeters: 7600,
      maxEstimatedTimeMinutes: 34,
      maxSegmentCount: 32,
      maxTurnCount: 26,
      maxJunctionDecisionCount: 22,
      maxRoundaboutSegmentCount: 4,
      maxRepeatedRoadCount: 2,
      maxAttempts: 240
    },
    scoringEmphasis: ["legal-validity", "junction-planning", "efficiency"],
    hintStyle: "low-disclosure",
    feedbackEmphasis: ["legal-validity", "junction-handling", "efficiency"],
    tags: ["dense-network", "advanced", "legal-route"]
  },
  {
    id: "advanced-multi-decision-route",
    title: "Advanced multi-decision route",
    exerciseType: "practise-junction-decision-making",
    targetDifficulty: "advanced",
    objectiveText: "Handle a longer route with repeated junction decisions, road changes, and route-choice pressure.",
    objectiveCategory: "junction-decision",
    generationConstraints: {
      minDistanceMeters: 950,
      maxDistanceMeters: 7000,
      maxEstimatedTimeMinutes: 32,
      maxSegmentCount: 30,
      maxTurnCount: 24,
      maxJunctionDecisionCount: 22,
      maxRoundaboutSegmentCount: 4,
      maxRepeatedRoadCount: 2,
      maxAttempts: 240
    },
    scoringEmphasis: ["junction-planning", "route-adherence", "efficiency"],
    hintStyle: "low-disclosure",
    feedbackEmphasis: ["junction-handling", "observation-planning", "efficiency"],
    tags: ["advanced", "multi-decision", "junctions"]
  }
];

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function templateById(): Map<LearnerScenarioTemplateId, LearnerScenarioTemplate> {
  return new Map(LEARNER_SCENARIO_TEMPLATES.map((template) => [template.id, template]));
}

export function getLearnerScenarioTemplate(id: LearnerScenarioTemplateId): LearnerScenarioTemplate {
  const template = templateById().get(id);

  if (!template) {
    throw new Error(`Unknown learner scenario template: ${id}`);
  }

  return template;
}

function scoringEmphasisObjectiveId(template: LearnerScenarioTemplate): string {
  return `scenario-objective-${template.id}`;
}

function linkedFaultCategoriesForTemplate(template: LearnerScenarioTemplate): DrivingFaultCategory[] {
  return uniqueStrings(
    template.scoringEmphasis.flatMap((emphasis) => faultCategoriesByScoringEmphasis[emphasis])
  ) as DrivingFaultCategory[];
}

function objectiveCategoryForTemplate(template: LearnerScenarioTemplate): ExerciseObjectiveCategory {
  return template.objectiveCategory ?? objectiveCategoryByScoringEmphasis[template.scoringEmphasis[0]];
}

function scenarioObjective(template: LearnerScenarioTemplate): ExerciseObjective {
  return {
    id: scoringEmphasisObjectiveId(template),
    title: template.title,
    category: objectiveCategoryForTemplate(template),
    description: template.objectiveText,
    required: true,
    successCriteria: [
      template.objectiveText,
      `Scoring focus: ${template.scoringEmphasis.map((emphasis) => scoringEmphasisLabels[emphasis]).join(", ")}.`
    ],
    linkedFaultCategories: linkedFaultCategoriesForTemplate(template)
  };
}

function scenarioMetadata(template: LearnerScenarioTemplate): LearnerScenarioMetadata {
  return {
    templateId: template.id,
    title: template.title,
    objectiveText: template.objectiveText,
    scoringEmphasis: [...template.scoringEmphasis],
    hintStyle: template.hintStyle,
    feedbackEmphasis: [...template.feedbackEmphasis]
  };
}

function templateTags(template: LearnerScenarioTemplate): string[] {
  return [
    "phase-7-scenario",
    `scenario-${template.id}`,
    `scenario-hint-${template.hintStyle}`,
    ...template.scoringEmphasis.map((emphasis) => `scenario-scoring-${emphasis}`),
    ...template.tags
  ];
}

export function applyLearnerScenarioTemplateToExercise<TExercise extends LearnerExercise>(
  exercise: TExercise,
  template: LearnerScenarioTemplate
): LearnerScenarioExercise<TExercise> {
  const objective = scenarioObjective(template);

  return {
    ...exercise,
    title: `${template.title}: ${exercise.title}`,
    type: template.exerciseType,
    difficulty: template.targetDifficulty,
    objectives: [objective, ...exercise.objectives.filter((candidate) => candidate.id !== objective.id)],
    tags: uniqueStrings([...(exercise.tags ?? []), ...templateTags(template)]),
    scenarioMetadata: scenarioMetadata(template)
  };
}

function selectedTemplate(input: {
  scenarioId?: LearnerScenarioTemplateId;
  scenarioTemplate?: LearnerScenarioTemplate;
  exercise?: LearnerExercise;
}): LearnerScenarioTemplate {
  if (input.scenarioTemplate) {
    return input.scenarioTemplate;
  }

  const exerciseMetadata = (input.exercise as { scenarioMetadata?: LearnerScenarioMetadata } | undefined)
    ?.scenarioMetadata;

  return getLearnerScenarioTemplate(input.scenarioId ?? exerciseMetadata?.templateId ?? "first-route-following-practice");
}

function mergeConstraints(
  template: LearnerScenarioTemplate,
  overrides: LearnerRouteValidationConstraints | undefined
): LearnerRouteValidationConstraints {
  return {
    ...scenarioConstraints(template.generationConstraints),
    ...(overrides ?? {})
  };
}

export function generateLearnerScenarioExercise(
  input: GenerateLearnerScenarioExerciseInput
): LearnerScenarioGenerationResult {
  const template = selectedTemplate(input);
  const result = generateLearnerExercise({
    map: input.map,
    difficulty: template.targetDifficulty,
    exerciseType: template.exerciseType,
    targetAreaBounds: input.targetAreaBounds ?? template.generationConstraints.targetAreaBounds,
    constraints: mergeConstraints(template, input.constraints),
    seed: [String(input.seed ?? "phase-7-scenario"), template.id].join(":"),
    maxAttempts: input.maxAttempts ?? template.generationConstraints.maxAttempts,
    published: input.published
  });

  if (result.status === "failed") {
    return {
      ...result,
      scenarioTemplate: template,
      explanation: `${result.explanation} Scenario template: ${template.title}.`
    };
  }

  const exercise = applyLearnerScenarioTemplateToExercise(result.exercise, template);

  return {
    ...result,
    scenarioTemplate: template,
    exercise,
    explanation: `${result.explanation} Scenario template: ${template.title}.`
  };
}

function validateConstraintNumbers(template: LearnerScenarioTemplate, errors: string[]): void {
  const constraints = template.generationConstraints;
  const numericEntries = Object.entries(constraints).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number"
  );

  for (const [key, value] of numericEntries) {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${template.id} has invalid generation constraint ${key}.`);
    }
  }

  if (
    typeof constraints.minDistanceMeters === "number" &&
    typeof constraints.maxDistanceMeters === "number" &&
    constraints.minDistanceMeters > constraints.maxDistanceMeters
  ) {
    errors.push(`${template.id} has minDistanceMeters above maxDistanceMeters.`);
  }
}

export function validateLearnerScenarioTemplate(
  template: LearnerScenarioTemplate
): LearnerScenarioValidationResult {
  const errors: string[] = [];

  if (!LEARNER_SCENARIO_TEMPLATE_IDS.includes(template.id)) {
    errors.push(`${template.id} is not a registered scenario id.`);
  }

  if (!template.title.trim()) {
    errors.push(`${template.id} is missing a title.`);
  }

  if (!isExerciseType(template.exerciseType)) {
    errors.push(`${template.id} has an invalid exercise type.`);
  }

  if (!isExerciseDifficulty(template.targetDifficulty)) {
    errors.push(`${template.id} has an invalid target difficulty.`);
  }

  if (!template.objectiveText.trim()) {
    errors.push(`${template.id} is missing objective text.`);
  }

  if (template.scoringEmphasis.length === 0) {
    errors.push(`${template.id} must define at least one scoring emphasis.`);
  }

  if (!LEARNER_SCENARIO_HINT_STYLES.includes(template.hintStyle)) {
    errors.push(`${template.id} has an invalid hint style.`);
  }

  if (template.feedbackEmphasis.length === 0) {
    errors.push(`${template.id} must define at least one feedback emphasis.`);
  }

  validateConstraintNumbers(template, errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateLearnerScenarioLibrary(
  templates: readonly LearnerScenarioTemplate[] = LEARNER_SCENARIO_TEMPLATES
): LearnerScenarioValidationResult {
  const errors = templates.flatMap((template) => validateLearnerScenarioTemplate(template).errors);
  const ids = templates.map((template) => template.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missingIds = LEARNER_SCENARIO_TEMPLATE_IDS.filter((id) => !ids.includes(id));

  for (const duplicateId of uniqueStrings(duplicateIds)) {
    errors.push(`Duplicate scenario id: ${duplicateId}.`);
  }

  for (const missingId of missingIds) {
    errors.push(`Missing scenario id: ${missingId}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function scenarioScoringDetails(
  template: LearnerScenarioTemplate,
  scoring: LearnerAttemptScoringResult
): LearnerScenarioScoringDetail[] {
  return template.scoringEmphasis.map((emphasis) => {
    const categories = faultCategoriesByScoringEmphasis[emphasis];
    const faultIds = scoring.faults
      .filter((fault) => categories.includes(fault.category))
      .map((fault) => fault.id);
    const objectiveId = scoringEmphasisObjectiveId(template);
    const scenarioObjectiveScore =
      scoring.objectiveScores.find((objective) => objective.objectiveId === objectiveId) ??
      scoring.objectiveScores.find((objective) => objective.category === objectiveCategoryByScoringEmphasis[emphasis]);
    const scorePercent = scenarioObjectiveScore?.scorePercent ?? (faultIds.length === 0 ? 100 : 0);
    const achieved = scenarioObjectiveScore?.achieved ?? faultIds.length === 0;

    return {
      scenarioId: template.id,
      emphasis,
      label: scoringEmphasisLabels[emphasis],
      objectiveId,
      scorePercent,
      achieved,
      faultIds,
      explanation:
        faultIds.length > 0
          ? `${scoringEmphasisLabels[emphasis]} was affected by ${faultIds.length} recorded fault(s).`
          : `${scoringEmphasisLabels[emphasis]} had no recorded scenario fault.`
    };
  });
}

export function scoreLearnerScenarioAttempt(
  input: ScoreLearnerScenarioAttemptInput
): LearnerScenarioAttemptScoringResult {
  const template = selectedTemplate({
    scenarioId: input.scenarioId,
    scenarioTemplate: input.scenarioTemplate,
    exercise: input.exercise
  });
  const exercise = applyLearnerScenarioTemplateToExercise(input.exercise, template);
  const scoring = scoreLearnerAttempt({
    ...input,
    exercise
  });

  return {
    ...scoring,
    scenarioScoringDetails: scenarioScoringDetails(template, scoring)
  };
}

function styledHintText(template: LearnerScenarioTemplate, hint: LearnerProgressiveHint): string {
  const stylePrompt = hintStylePrompts[template.hintStyle];

  if (hint.text.startsWith(stylePrompt)) {
    return hint.text;
  }

  return `${stylePrompt} ${hint.text}`;
}

function styledFallbackText(template: LearnerScenarioTemplate, fallback: LearnerHintFallback): LearnerHintFallback {
  return {
    ...fallback,
    text: `${hintStylePrompts[template.hintStyle]} ${fallback.text}`
  };
}

export function generateLearnerScenarioHint(
  input: GenerateLearnerScenarioHintInput
): LearnerScenarioHintGenerationResult {
  const template = selectedTemplate({
    scenarioId: input.scenarioId,
    scenarioTemplate: input.scenarioTemplate,
    exercise: input.exercise
  });
  const exercise = applyLearnerScenarioTemplateToExercise(input.exercise, template);
  const result = generateLearnerHint({
    ...input,
    exercise,
    objectiveId: input.objectiveId ?? scoringEmphasisObjectiveId(template)
  });

  if (result.status === "fallback") {
    return {
      ...result,
      scenarioTemplate: template,
      fallback: styledFallbackText(template, result.fallback),
      explanation: `${result.explanation} Scenario hint style: ${template.hintStyle}.`
    };
  }

  const styledHint: LearnerProgressiveHint = {
    ...result.hint,
    title: `${template.title}: ${result.hint.title}`,
    text: styledHintText(template, result.hint)
  };
  const attemptEvent = result.attemptEvent
    ? {
        ...result.attemptEvent,
        hintId: styledHint.id,
        hintLevel: styledHint.level
      }
    : undefined;

  return {
    ...result,
    scenarioTemplate: template,
    hint: styledHint,
    attemptEvent,
    explanation: `${result.explanation} Scenario hint style: ${template.hintStyle}.`
  };
}

export function learnerScenarioHintStylePrompt(style: LearnerScenarioHintStyle): string {
  return hintStylePrompts[style];
}

export function learnerScenarioScoringEmphasisLabel(emphasis: LearnerScenarioScoringEmphasis): string {
  return scoringEmphasisLabels[emphasis];
}

export function learnerScenarioTemplateSeed(input: {
  map: MapDefinition;
  scenario: LearnerScenarioTemplate;
  seed?: string | number;
}): string {
  return [String(input.seed ?? "phase-7-scenario"), input.map.id, input.scenario.id].join(":");
}
