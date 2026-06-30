import type { MapDefinition, RouteExercise } from "../../../lib/map-engine/index.ts";

export type ExerciseDifficulty = "intro" | "easy" | "medium" | "hard" | "exam-style";

export type ExerciseSkillTag =
  | "route-planning"
  | "shortest-legal-route"
  | "restriction-awareness"
  | "one-way-compliance"
  | "no-entry-compliance"
  | "prohibited-turn-compliance"
  | "restricted-road-compliance"
  | "checkpoint-ordering"
  | "start-destination-accuracy"
  | "route-efficiency"
  | "map-reading";

export type ExerciseWeakAreaTag =
  | "no-entry"
  | "one-way"
  | "prohibited-turn"
  | "restricted-road"
  | "wrong-start"
  | "wrong-destination"
  | "missed-checkpoint"
  | "disconnected-route"
  | "insufficient-drawing"
  | "inefficient-route";

export type RouteFeatureTag =
  | "simple-grid"
  | "multi-junction"
  | "turn-restrictions"
  | "one-way-system"
  | "restricted-access"
  | "checkpoint-route"
  | "short-route"
  | "long-route"
  | "dense-network";

export type MapMetadata = {
  id: string;
  title: string;
  description?: string;
  mapKind: "synthetic-dev" | "osm-derived" | "production";
  version: string;
  areaLabel?: string;
  featureTags: RouteFeatureTag[];
  restrictionTags: ExerciseWeakAreaTag[];
};

export type ExerciseMetadata = {
  exerciseId: string;
  mapId: string;
  title: string;
  description?: string;
  difficulty: ExerciseDifficulty;
  estimatedMinutes: number;
  skillTags: ExerciseSkillTag[];
  weakAreaTags: ExerciseWeakAreaTag[];
  routeFeatureTags: RouteFeatureTag[];
  prerequisiteExerciseIds?: string[];
  relatedExerciseIds?: string[];
};

export type MetadataValidationIssueSeverity = "error" | "warning";

export type MetadataValidationIssue = {
  code:
    | "duplicate-map-id"
    | "duplicate-exercise-id"
    | "unknown-map-id"
    | "unknown-route-exercise-id"
    | "missing-exercise-metadata"
    | "missing-title"
    | "missing-tags"
    | "invalid-estimated-minutes"
    | "unknown-related-exercise"
    | "unknown-prerequisite-exercise";
  severity: MetadataValidationIssueSeverity;
  message: string;
  mapId?: string;
  exerciseId?: string;
  relatedExerciseId?: string;
};

export type MetadataValidationResult = {
  isValid: boolean;
  issues: MetadataValidationIssue[];
};

export type ExerciseMetadataCatalogue = {
  maps: MapMetadata[];
  exercises: ExerciseMetadata[];
};

export type AdaptivePracticeExerciseCatalogueItem = {
  id: string;
  title: string;
  focusAreas: string[];
  difficulty: "easy" | "medium" | "hard";
};

export const MARLOWE_DISTRICT_MAP_METADATA: MapMetadata = {
  id: "marlowe-district-dev-map",
  title: "Marlowe District",
  description: "Synthetic development map used for route drawing, snapping, matching, and adaptive practice tests.",
  mapKind: "synthetic-dev",
  version: "1",
  areaLabel: "Marlowe District fictional London-style network",
  featureTags: [
    "simple-grid",
    "multi-junction",
    "turn-restrictions",
    "one-way-system",
    "restricted-access",
    "checkpoint-route",
    "dense-network"
  ],
  restrictionTags: ["no-entry", "one-way", "prohibited-turn", "restricted-road"]
};

export const MARLOWE_DISTRICT_EXERCISE_METADATA: ExerciseMetadata[] = [
  {
    exerciseId: "ex-station-to-hospital",
    mapId: "marlowe-district-dev-map",
    title: "Fox Lane Station to Northgate Hospital",
    description: "A short restriction-aware route with no-entry and one-way alternatives near the station.",
    difficulty: "easy",
    estimatedMinutes: 4,
    skillTags: ["route-planning", "restriction-awareness", "no-entry-compliance", "one-way-compliance", "route-efficiency"],
    weakAreaTags: ["no-entry", "one-way", "inefficient-route"],
    routeFeatureTags: ["short-route", "one-way-system", "restricted-access", "multi-junction"],
    relatedExerciseIds: ["ex-canal-to-theatre"]
  },
  {
    exerciseId: "ex-library-market-museum",
    mapId: "marlowe-district-dev-map",
    title: "Westbourne Library to Civic Museum via Marlowe Market Hall",
    description: "A medium checkpoint route through the market area and museum-side junctions.",
    difficulty: "medium",
    estimatedMinutes: 6,
    skillTags: ["checkpoint-ordering", "start-destination-accuracy", "route-planning", "route-efficiency"],
    weakAreaTags: ["missed-checkpoint", "wrong-start", "wrong-destination", "inefficient-route"],
    routeFeatureTags: ["checkpoint-route", "multi-junction", "dense-network"],
    prerequisiteExerciseIds: ["ex-station-to-hospital"],
    relatedExerciseIds: ["ex-crown-market-gardens"]
  },
  {
    exerciseId: "ex-gardens-yard-exchange",
    mapId: "marlowe-district-dev-map",
    title: "Royal Oak Gardens to Exchange House via Queen's Yard",
    description: "A checkpoint route that combines no-entry awareness with southern network route efficiency.",
    difficulty: "medium",
    estimatedMinutes: 6,
    skillTags: ["checkpoint-ordering", "no-entry-compliance", "route-efficiency", "route-planning"],
    weakAreaTags: ["missed-checkpoint", "no-entry", "inefficient-route"],
    routeFeatureTags: ["checkpoint-route", "restricted-access", "multi-junction"],
    prerequisiteExerciseIds: ["ex-station-to-hospital"],
    relatedExerciseIds: ["ex-library-market-museum"]
  },
  {
    exerciseId: "ex-church-to-east-dock",
    mapId: "marlowe-district-dev-map",
    title: "St Anselm Church to East Dock",
    description: "A harder route with prohibited-turn, restricted-road, and one-way compliance pressure.",
    difficulty: "hard",
    estimatedMinutes: 8,
    skillTags: [
      "restriction-awareness",
      "prohibited-turn-compliance",
      "restricted-road-compliance",
      "one-way-compliance",
      "shortest-legal-route"
    ],
    weakAreaTags: ["prohibited-turn", "restricted-road", "one-way", "inefficient-route"],
    routeFeatureTags: ["long-route", "turn-restrictions", "one-way-system", "restricted-access", "dense-network"],
    prerequisiteExerciseIds: ["ex-library-market-museum"],
    relatedExerciseIds: ["ex-crown-market-gardens"]
  },
  {
    exerciseId: "ex-canal-to-theatre",
    mapId: "marlowe-district-dev-map",
    title: "Canal Bridge West to Theatre Arcade",
    description: "A drawing-confidence route for continuous line capture and junction-to-junction road following.",
    difficulty: "medium",
    estimatedMinutes: 5,
    skillTags: ["map-reading", "route-planning", "start-destination-accuracy"],
    weakAreaTags: ["disconnected-route", "insufficient-drawing", "wrong-destination"],
    routeFeatureTags: ["multi-junction", "one-way-system", "dense-network"],
    relatedExerciseIds: ["ex-station-to-hospital"]
  },
  {
    exerciseId: "ex-crown-market-gardens",
    mapId: "marlowe-district-dev-map",
    title: "Crown Court to Royal Oak Gardens via Marlowe Market Hall",
    description: "A hard multi-stop route focused on turn restrictions and ordered checkpoint discipline.",
    difficulty: "hard",
    estimatedMinutes: 8,
    skillTags: ["prohibited-turn-compliance", "checkpoint-ordering", "restriction-awareness", "route-efficiency"],
    weakAreaTags: ["prohibited-turn", "missed-checkpoint", "wrong-destination", "inefficient-route"],
    routeFeatureTags: ["checkpoint-route", "turn-restrictions", "long-route", "dense-network"],
    prerequisiteExerciseIds: ["ex-library-market-museum"],
    relatedExerciseIds: ["ex-church-to-east-dock"]
  },
  {
    exerciseId: "ex-central-grid-library-clocktower",
    mapId: "marlowe-district-dev-map",
    title: "Central grid: Westbourne Library to Clocktower via Market Hall",
    description: "An introductory central-grid exercise with simple planning, one-way flow, and no-entry awareness.",
    difficulty: "intro",
    estimatedMinutes: 4,
    skillTags: ["route-planning", "map-reading", "one-way-compliance", "no-entry-compliance"],
    weakAreaTags: ["one-way", "no-entry", "inefficient-route"],
    routeFeatureTags: ["simple-grid", "short-route", "one-way-system", "restricted-access"],
    relatedExerciseIds: ["ex-library-market-museum", "ex-one-way-canal-station"]
  },
  {
    exerciseId: "ex-one-way-canal-station",
    mapId: "marlowe-district-dev-map",
    title: "One-way system: Canal Bridge West to Fox Lane Station",
    description: "A focused one-way exercise through the canal and clocktower approaches.",
    difficulty: "medium",
    estimatedMinutes: 5,
    skillTags: ["one-way-compliance", "route-planning", "map-reading", "shortest-legal-route"],
    weakAreaTags: ["one-way", "wrong-destination", "inefficient-route"],
    routeFeatureTags: ["one-way-system", "multi-junction", "short-route"],
    prerequisiteExerciseIds: ["ex-central-grid-library-clocktower"],
    relatedExerciseIds: ["ex-station-to-hospital", "ex-canal-to-theatre"]
  },
  {
    exerciseId: "ex-no-entry-eastgate-market",
    mapId: "marlowe-district-dev-map",
    title: "No-entry focus: Eastgate to Marlowe Market Hall",
    description: "A no-entry-heavy route where the direct-looking station and market approaches are not all usable.",
    difficulty: "hard",
    estimatedMinutes: 8,
    skillTags: ["no-entry-compliance", "restriction-awareness", "route-planning", "shortest-legal-route"],
    weakAreaTags: ["no-entry", "one-way", "inefficient-route"],
    routeFeatureTags: ["restricted-access", "one-way-system", "long-route", "dense-network"],
    prerequisiteExerciseIds: ["ex-central-grid-library-clocktower"],
    relatedExerciseIds: ["ex-station-to-hospital", "ex-efficiency-trap-gardens-hospital"]
  },
  {
    exerciseId: "ex-prohibited-turn-albion-theatre",
    mapId: "marlowe-district-dev-map",
    title: "Prohibited turns: Albion Square to Theatre Arcade",
    description: "A prohibited-turn exercise around Market Cross and Civic Museum where the obvious turn is banned.",
    difficulty: "hard",
    estimatedMinutes: 7,
    skillTags: ["prohibited-turn-compliance", "restriction-awareness", "route-planning", "route-efficiency"],
    weakAreaTags: ["prohibited-turn", "inefficient-route", "wrong-destination"],
    routeFeatureTags: ["turn-restrictions", "multi-junction", "dense-network"],
    prerequisiteExerciseIds: ["ex-library-market-museum"],
    relatedExerciseIds: ["ex-crown-market-gardens", "ex-mixed-difficulty-church-market-theatre-dock"]
  },
  {
    exerciseId: "ex-restricted-station-south-gate",
    mapId: "marlowe-district-dev-map",
    title: "Restricted road awareness: Fox Lane Station to South Gate",
    description: "A visual restricted-road exercise using the local-access East Dock Spur symbol layer.",
    difficulty: "medium",
    estimatedMinutes: 5,
    skillTags: ["restricted-road-compliance", "restriction-awareness", "map-reading", "route-planning"],
    weakAreaTags: ["restricted-road", "wrong-destination", "inefficient-route"],
    routeFeatureTags: ["restricted-access", "short-route", "multi-junction"],
    prerequisiteExerciseIds: ["ex-station-to-hospital"],
    relatedExerciseIds: ["ex-church-to-east-dock"]
  },
  {
    exerciseId: "ex-checkpoint-order-library-dock",
    mapId: "marlowe-district-dev-map",
    title: "Checkpoint order: Westbourne Library to East Dock",
    description: "A long ordered-stop route with three intermediate checkpoints before the dock destination.",
    difficulty: "hard",
    estimatedMinutes: 9,
    skillTags: ["checkpoint-ordering", "route-planning", "start-destination-accuracy", "restriction-awareness"],
    weakAreaTags: ["missed-checkpoint", "wrong-start", "wrong-destination", "inefficient-route"],
    routeFeatureTags: ["checkpoint-route", "long-route", "restricted-access", "dense-network"],
    prerequisiteExerciseIds: ["ex-library-market-museum"],
    relatedExerciseIds: ["ex-mixed-difficulty-church-market-theatre-dock"]
  },
  {
    exerciseId: "ex-efficiency-trap-gardens-hospital",
    mapId: "marlowe-district-dev-map",
    title: "Efficiency trap: Royal Oak Gardens to Northgate Hospital",
    description: "A legal-route efficiency drill where several plausible detours are much longer than the shortest route.",
    difficulty: "medium",
    estimatedMinutes: 6,
    skillTags: ["route-efficiency", "shortest-legal-route", "route-planning", "map-reading"],
    weakAreaTags: ["inefficient-route", "one-way", "wrong-destination"],
    routeFeatureTags: ["multi-junction", "one-way-system", "restricted-access"],
    prerequisiteExerciseIds: ["ex-central-grid-library-clocktower"],
    relatedExerciseIds: ["ex-no-entry-eastgate-market"]
  },
  {
    exerciseId: "ex-mixed-difficulty-church-market-theatre-dock",
    mapId: "marlowe-district-dev-map",
    title: "Mixed difficulty: Church to East Dock via Market and Theatre",
    description: "An exam-style synthetic route combining checkpoints, no-entry, one-way, turn restrictions, and restricted-road awareness.",
    difficulty: "exam-style",
    estimatedMinutes: 10,
    skillTags: [
      "checkpoint-ordering",
      "no-entry-compliance",
      "one-way-compliance",
      "prohibited-turn-compliance",
      "restricted-road-compliance",
      "route-efficiency"
    ],
    weakAreaTags: ["missed-checkpoint", "no-entry", "one-way", "prohibited-turn", "restricted-road", "inefficient-route"],
    routeFeatureTags: [
      "checkpoint-route",
      "turn-restrictions",
      "one-way-system",
      "restricted-access",
      "long-route",
      "dense-network"
    ],
    prerequisiteExerciseIds: ["ex-checkpoint-order-library-dock", "ex-prohibited-turn-albion-theatre"],
    relatedExerciseIds: ["ex-church-to-east-dock", "ex-crown-market-gardens"]
  }
];

export const MARLOWE_DISTRICT_METADATA_CATALOGUE: ExerciseMetadataCatalogue = {
  maps: [MARLOWE_DISTRICT_MAP_METADATA],
  exercises: MARLOWE_DISTRICT_EXERCISE_METADATA
};

export function createMapMetadataIndex(maps: readonly MapMetadata[]): Map<string, MapMetadata> {
  return new Map(maps.map((mapMetadata) => [mapMetadata.id, cloneMapMetadata(mapMetadata)]));
}

export function createExerciseMetadataIndex(exercises: readonly ExerciseMetadata[]): Map<string, ExerciseMetadata> {
  return new Map(exercises.map((metadata) => [metadata.exerciseId, cloneExerciseMetadata(metadata)]));
}

export function getExerciseMetadata(
  exercises: readonly ExerciseMetadata[],
  exerciseId: string
): ExerciseMetadata | null {
  const metadata = exercises.find((candidate) => candidate.exerciseId === exerciseId);

  return metadata ? cloneExerciseMetadata(metadata) : null;
}

export function getMapMetadataForExercise(
  catalogue: ExerciseMetadataCatalogue,
  exerciseId: string
): MapMetadata | null {
  const exerciseMetadata = getExerciseMetadata(catalogue.exercises, exerciseId);

  if (!exerciseMetadata) {
    return null;
  }

  const mapMetadata = catalogue.maps.find((candidate) => candidate.id === exerciseMetadata.mapId);

  return mapMetadata ? cloneMapMetadata(mapMetadata) : null;
}

export function findExerciseMetadataByWeakArea(
  exercises: readonly ExerciseMetadata[],
  weakAreaTag: ExerciseWeakAreaTag
): ExerciseMetadata[] {
  return exercises
    .filter((metadata) => metadata.weakAreaTags.includes(weakAreaTag))
    .map((metadata) => cloneExerciseMetadata(metadata));
}

export function findExerciseMetadataBySkill(
  exercises: readonly ExerciseMetadata[],
  skillTag: ExerciseSkillTag
): ExerciseMetadata[] {
  return exercises
    .filter((metadata) => metadata.skillTags.includes(skillTag))
    .map((metadata) => cloneExerciseMetadata(metadata));
}

export function findExerciseMetadataByDifficulty(
  exercises: readonly ExerciseMetadata[],
  difficulty: ExerciseDifficulty
): ExerciseMetadata[] {
  return exercises
    .filter((metadata) => metadata.difficulty === difficulty)
    .map((metadata) => cloneExerciseMetadata(metadata));
}

export function exerciseMetadataToAdaptivePracticeExercise(
  metadata: ExerciseMetadata
): AdaptivePracticeExerciseCatalogueItem {
  return {
    id: metadata.exerciseId,
    title: metadata.title,
    focusAreas: metadataFocusAreas(metadata),
    difficulty: adaptiveDifficulty(metadata.difficulty)
  };
}

export function exerciseMetadataCatalogueToAdaptivePracticeExercises(
  exercises: readonly ExerciseMetadata[]
): AdaptivePracticeExerciseCatalogueItem[] {
  return exercises.map((metadata) => exerciseMetadataToAdaptivePracticeExercise(metadata));
}

export function validateExerciseMapMetadata(input: {
  maps: readonly MapMetadata[];
  exercises: readonly ExerciseMetadata[];
  routeExercises?: readonly RouteExercise[];
  mapDefinitions?: readonly MapDefinition[];
}): MetadataValidationResult {
  const issues: MetadataValidationIssue[] = [];
  const mapIds = new Set<string>();
  const exerciseIds = new Set<string>();
  const routeExerciseIds = new Set(input.routeExercises?.map((exercise) => exercise.id) ?? []);
  const mapDefinitionIds = new Set(input.mapDefinitions?.map((mapDefinition) => mapDefinition.id) ?? []);

  for (const mapMetadata of input.maps) {
    if (mapIds.has(mapMetadata.id)) {
      issues.push({
        code: "duplicate-map-id",
        severity: "error",
        message: `Duplicate map metadata id: ${mapMetadata.id}.`,
        mapId: mapMetadata.id
      });
    }

    mapIds.add(mapMetadata.id);

    if (!mapMetadata.title.trim()) {
      issues.push({
        code: "missing-title",
        severity: "error",
        message: `Map metadata ${mapMetadata.id} must have a title.`,
        mapId: mapMetadata.id
      });
    }

    if (mapMetadata.featureTags.length === 0 || mapMetadata.restrictionTags.length === 0) {
      issues.push({
        code: "missing-tags",
        severity: "warning",
        message: `Map metadata ${mapMetadata.id} should include feature and restriction tags.`,
        mapId: mapMetadata.id
      });
    }

    if (mapDefinitionIds.size > 0 && !mapDefinitionIds.has(mapMetadata.id)) {
      issues.push({
        code: "unknown-map-id",
        severity: "error",
        message: `Map metadata ${mapMetadata.id} does not match a known map definition.`,
        mapId: mapMetadata.id
      });
    }
  }

  for (const exerciseMetadata of input.exercises) {
    if (exerciseIds.has(exerciseMetadata.exerciseId)) {
      issues.push({
        code: "duplicate-exercise-id",
        severity: "error",
        message: `Duplicate exercise metadata id: ${exerciseMetadata.exerciseId}.`,
        exerciseId: exerciseMetadata.exerciseId
      });
    }

    exerciseIds.add(exerciseMetadata.exerciseId);

    if (!mapIds.has(exerciseMetadata.mapId)) {
      issues.push({
        code: "unknown-map-id",
        severity: "error",
        message: `Exercise ${exerciseMetadata.exerciseId} references unknown map ${exerciseMetadata.mapId}.`,
        mapId: exerciseMetadata.mapId,
        exerciseId: exerciseMetadata.exerciseId
      });
    }

    if (routeExerciseIds.size > 0 && !routeExerciseIds.has(exerciseMetadata.exerciseId)) {
      issues.push({
        code: "unknown-route-exercise-id",
        severity: "error",
        message: `Exercise metadata ${exerciseMetadata.exerciseId} does not match a route exercise.`,
        exerciseId: exerciseMetadata.exerciseId
      });
    }

    if (!exerciseMetadata.title.trim()) {
      issues.push({
        code: "missing-title",
        severity: "error",
        message: `Exercise metadata ${exerciseMetadata.exerciseId} must have a title.`,
        exerciseId: exerciseMetadata.exerciseId
      });
    }

    if (exerciseMetadata.estimatedMinutes <= 0 || !Number.isFinite(exerciseMetadata.estimatedMinutes)) {
      issues.push({
        code: "invalid-estimated-minutes",
        severity: "error",
        message: `Exercise metadata ${exerciseMetadata.exerciseId} must have a positive estimated duration.`,
        exerciseId: exerciseMetadata.exerciseId
      });
    }

    if (
      exerciseMetadata.skillTags.length === 0 ||
      exerciseMetadata.weakAreaTags.length === 0 ||
      exerciseMetadata.routeFeatureTags.length === 0
    ) {
      issues.push({
        code: "missing-tags",
        severity: "warning",
        message: `Exercise metadata ${exerciseMetadata.exerciseId} should include skill, weak-area, and route-feature tags.`,
        exerciseId: exerciseMetadata.exerciseId
      });
    }

    for (const relatedExerciseId of exerciseMetadata.relatedExerciseIds ?? []) {
      if (!exerciseIds.has(relatedExerciseId) && !input.exercises.some((exercise) => exercise.exerciseId === relatedExerciseId)) {
        issues.push({
          code: "unknown-related-exercise",
          severity: "error",
          message: `Exercise ${exerciseMetadata.exerciseId} references unknown related exercise ${relatedExerciseId}.`,
          exerciseId: exerciseMetadata.exerciseId,
          relatedExerciseId
        });
      }
    }

    for (const prerequisiteExerciseId of exerciseMetadata.prerequisiteExerciseIds ?? []) {
      if (
        !exerciseIds.has(prerequisiteExerciseId) &&
        !input.exercises.some((exercise) => exercise.exerciseId === prerequisiteExerciseId)
      ) {
        issues.push({
          code: "unknown-prerequisite-exercise",
          severity: "error",
          message: `Exercise ${exerciseMetadata.exerciseId} references unknown prerequisite ${prerequisiteExerciseId}.`,
          exerciseId: exerciseMetadata.exerciseId,
          relatedExerciseId: prerequisiteExerciseId
        });
      }
    }
  }

  for (const routeExercise of input.routeExercises ?? []) {
    if (!exerciseIds.has(routeExercise.id)) {
      issues.push({
        code: "missing-exercise-metadata",
        severity: "error",
        message: `Route exercise ${routeExercise.id} is missing exercise metadata.`,
        exerciseId: routeExercise.id
      });
    }
  }

  return {
    isValid: !issues.some((issue) => issue.severity === "error"),
    issues
  };
}

function metadataFocusAreas(metadata: ExerciseMetadata): string[] {
  const focusAreas = [
    ...metadata.weakAreaTags.map((tag) => weakAreaTagToAdaptiveFocus(tag)),
    ...metadata.skillTags,
    ...metadata.routeFeatureTags
  ].filter((tag): tag is string => Boolean(tag));

  return focusAreas.filter((tag, index) => focusAreas.indexOf(tag) === index).sort();
}

function weakAreaTagToAdaptiveFocus(tag: ExerciseWeakAreaTag): string {
  const mappedTags: Record<ExerciseWeakAreaTag, string> = {
    "no-entry": "no-entry",
    "one-way": "one-way-direction",
    "prohibited-turn": "prohibited-turn",
    "restricted-road": "restricted-road",
    "wrong-start": "wrong-start",
    "wrong-destination": "wrong-destination",
    "missed-checkpoint": "missed-checkpoint",
    "disconnected-route": "disconnected-drawing",
    "insufficient-drawing": "insufficient-drawing",
    "inefficient-route": "route-efficiency"
  };

  return mappedTags[tag];
}

function adaptiveDifficulty(difficulty: ExerciseDifficulty): "easy" | "medium" | "hard" {
  if (difficulty === "intro" || difficulty === "easy") {
    return "easy";
  }

  if (difficulty === "hard" || difficulty === "exam-style") {
    return "hard";
  }

  return "medium";
}

function cloneMapMetadata(metadata: MapMetadata): MapMetadata {
  return {
    ...metadata,
    featureTags: [...metadata.featureTags],
    restrictionTags: [...metadata.restrictionTags]
  };
}

function cloneExerciseMetadata(metadata: ExerciseMetadata): ExerciseMetadata {
  return {
    ...metadata,
    skillTags: [...metadata.skillTags],
    weakAreaTags: [...metadata.weakAreaTags],
    routeFeatureTags: [...metadata.routeFeatureTags],
    prerequisiteExerciseIds: metadata.prerequisiteExerciseIds ? [...metadata.prerequisiteExerciseIds] : undefined,
    relatedExerciseIds: metadata.relatedExerciseIds ? [...metadata.relatedExerciseIds] : undefined
  };
}
