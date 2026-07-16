import type {
  MapDefinition,
  RouteExercise,
  RouteExerciseDifficulty,
  RouteStop
} from "../../../lib/map-engine/index.ts";
import type { RouteRunnerMapOption } from "../../dev/route-runner/routeRunnerMapOptionUtils.ts";

export const EXAM_ROUTE_PACK_STAGE = "9.4";
export const EXAM_ROUTE_TASK_VERSION = "1.0.0";

export const EXAM_ROUTE_TAGS = [
  "bridge",
  "one-way-awareness",
  "major-road-choice",
  "landmark",
  "residential",
  "central-density",
  "station",
  "hospital",
  "public-building",
  "checkpoint"
] as const;

export type ExamRouteTag = (typeof EXAM_ROUTE_TAGS)[number];

export type ExamRouteEndpointMetadata = {
  label: string;
  stopType: RouteStop["type"];
  stopId: string;
  sourceExerciseId: string;
  sourceStopIndex: number;
};

export type ExamRouteTaskMetadata = {
  stage: typeof EXAM_ROUTE_PACK_STAGE;
  taskVersion: typeof EXAM_ROUTE_TASK_VERSION;
  mapId: string;
  origin: ExamRouteEndpointMetadata;
  destination: ExamRouteEndpointMetadata;
  checkpoints: ExamRouteEndpointMetadata[];
  tags: ExamRouteTag[];
  source: {
    kind: "existing-committed-fixture-stops";
    fixtureName: string | null;
    attribution: string | null;
    sourceExerciseIds: string[];
  };
  officialTfLTask: false;
};

export type ExamRouteExercise = RouteExercise & {
  examRouteMetadata: ExamRouteTaskMetadata;
};

type SourceStopReference = {
  exerciseId: string;
  stopIndex: number;
};

type ExamRouteTaskSpec = {
  id: string;
  mapId: string;
  title: string;
  description: string;
  difficulty: RouteExerciseDifficulty;
  origin: SourceStopReference;
  destination: SourceStopReference;
  checkpoints?: readonly SourceStopReference[];
  tags: readonly ExamRouteTag[];
};

export const EXAM_ROUTE_TASK_SPECS: readonly ExamRouteTaskSpec[] = [
  {
    id: "exam-9-4-mortimer-market-to-byng-place",
    mapId: "osm-real-london-pilot",
    title: "Mortimer Market to Byng Place",
    description: "Plan from Mortimer Market to Byng Place and submit the complete route.",
    difficulty: "hard",
    origin: { exerciseId: "osm-real-pilot-mortimer-goodge-options", stopIndex: 0 },
    destination: { exerciseId: "osm-real-pilot-longer-route", stopIndex: 1 },
    tags: ["central-density", "major-road-choice"]
  },
  {
    id: "exam-9-4-regent-street-to-haymarket",
    mapId: "osm-curated-piccadilly-circus",
    title: "Regent Street to Haymarket",
    description: "Plan from Regent Street to Haymarket and submit the complete route.",
    difficulty: "hard",
    origin: { exerciseId: "osm-curated-piccadilly-circus-longer-central-route", stopIndex: 1 },
    destination: { exerciseId: "osm-curated-piccadilly-circus-short-central-route", stopIndex: 1 },
    tags: ["central-density", "major-road-choice"]
  },
  {
    id: "exam-9-4-lancaster-place-stamford-blackfriars",
    mapId: "osm-curated-waterloo-bridge",
    title: "Lancaster Place to Blackfriars Road via Stamford Street",
    description:
      "Plan from Lancaster Place, pass Stamford Street, and finish on Blackfriars Road.",
    difficulty: "hard",
    origin: { exerciseId: "osm-curated-waterloo-bridge-station-context-checkpoint", stopIndex: 0 },
    destination: { exerciseId: "osm-curated-waterloo-bridge-thames-crossing-route", stopIndex: 1 },
    checkpoints: [
      { exerciseId: "osm-curated-waterloo-bridge-station-context-checkpoint", stopIndex: 1 }
    ],
    tags: ["bridge", "major-road-choice", "central-density", "checkpoint"]
  },
  {
    id: "exam-9-4-grays-inn-road-to-goodge-street",
    mapId: "osm-curated-one-way-system-area",
    title: "Gray's Inn Road to Goodge Street",
    description: "Plan from Gray's Inn Road to Goodge Street and submit the complete route.",
    difficulty: "hard",
    origin: { exerciseId: "osm-curated-one-way-system-area-short-one-way-route", stopIndex: 1 },
    destination: { exerciseId: "osm-curated-one-way-system-area-short-one-way-route", stopIndex: 0 },
    tags: ["one-way-awareness", "central-density", "major-road-choice"]
  },
  {
    id: "exam-9-4-hendon-way-to-cricklewood-lane",
    mapId: "osm-curated-quiet-residential-roads",
    title: "Hendon Way to Cricklewood Lane",
    description: "Plan from Hendon Way to Cricklewood Lane and submit the complete route.",
    difficulty: "medium",
    origin: { exerciseId: "osm-curated-quiet-residential-roads-major-to-side-road-route", stopIndex: 2 },
    destination: { exerciseId: "osm-curated-quiet-residential-roads-short-residential-route", stopIndex: 0 },
    tags: ["residential", "major-road-choice"]
  },
  {
    id: "exam-9-4-fox-lane-station-to-crown-court",
    mapId: "marlowe-district-dev-map",
    title: "Fox Lane Station to Crown Court",
    description: "Plan from Fox Lane Station to Crown Court and submit the complete route.",
    difficulty: "medium",
    origin: { exerciseId: "ex-station-to-hospital", stopIndex: 0 },
    destination: { exerciseId: "ex-crown-market-gardens", stopIndex: 0 },
    tags: ["station", "landmark", "public-building"]
  },
  {
    id: "exam-9-4-albion-square-to-northgate-hospital",
    mapId: "marlowe-district-dev-map",
    title: "Albion Square to Northgate Hospital",
    description: "Plan from Albion Square to Northgate Hospital and submit the complete route.",
    difficulty: "medium",
    origin: { exerciseId: "ex-prohibited-turn-albion-theatre", stopIndex: 0 },
    destination: { exerciseId: "ex-station-to-hospital", stopIndex: 1 },
    tags: ["hospital", "landmark", "public-building"]
  }
];

type ResolvedSourceStop = {
  stop: RouteStop;
  metadata: ExamRouteEndpointMetadata;
};

function stopId(stop: RouteStop): string {
  return stop.type === "node" ? stop.nodeId : stop.landmarkId;
}

function stopLabel(map: MapDefinition, stop: RouteStop): string | null {
  const explicitLabel = stop.label?.trim();

  if (explicitLabel) {
    return explicitLabel;
  }

  if (stop.type === "landmark") {
    return map.landmarks.find((landmark) => landmark.id === stop.landmarkId)?.name.trim() || null;
  }

  return map.nodes.find((node) => node.id === stop.nodeId)?.label?.trim() || null;
}

function resolveSourceStop(
  option: RouteRunnerMapOption,
  reference: SourceStopReference
): ResolvedSourceStop {
  const sourceExercise = option.exercises.find((exercise) => exercise.id === reference.exerciseId);

  if (!sourceExercise) {
    throw new Error(`Exam route pack source exercise ${reference.exerciseId} is missing from ${option.map.id}.`);
  }

  const sourceStop = sourceExercise.stops[reference.stopIndex];

  if (!sourceStop) {
    throw new Error(
      `Exam route pack source stop ${reference.exerciseId}[${reference.stopIndex}] is missing from ${option.map.id}.`
    );
  }

  const label = stopLabel(option.map, sourceStop);

  if (!label) {
    throw new Error(
      `Exam route pack source stop ${reference.exerciseId}[${reference.stopIndex}] does not have a dependable label.`
    );
  }

  return {
    stop: { ...sourceStop },
    metadata: {
      label,
      stopType: sourceStop.type,
      stopId: stopId(sourceStop),
      sourceExerciseId: reference.exerciseId,
      sourceStopIndex: reference.stopIndex
    }
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function buildExamRouteExercise(
  option: RouteRunnerMapOption,
  spec: ExamRouteTaskSpec
): ExamRouteExercise {
  const origin = resolveSourceStop(option, spec.origin);
  const destination = resolveSourceStop(option, spec.destination);
  const checkpoints = (spec.checkpoints ?? []).map((reference) => resolveSourceStop(option, reference));

  if (origin.metadata.stopId === destination.metadata.stopId) {
    throw new Error(`Exam route task ${spec.id} must use different origin and destination stops.`);
  }

  if (new Set(spec.tags).size !== spec.tags.length) {
    throw new Error(`Exam route task ${spec.id} has duplicate skill tags.`);
  }

  return {
    id: spec.id,
    title: spec.title,
    mapId: option.map.id,
    exerciseVersion: EXAM_ROUTE_TASK_VERSION,
    stops: [origin.stop, ...checkpoints.map((checkpoint) => checkpoint.stop), destination.stop],
    description: spec.description,
    difficulty: spec.difficulty,
    examRouteMetadata: {
      stage: EXAM_ROUTE_PACK_STAGE,
      taskVersion: EXAM_ROUTE_TASK_VERSION,
      mapId: option.map.id,
      origin: origin.metadata,
      destination: destination.metadata,
      checkpoints: checkpoints.map((checkpoint) => checkpoint.metadata),
      tags: [...spec.tags],
      source: {
        kind: "existing-committed-fixture-stops",
        fixtureName: option.fixtureName ?? null,
        attribution: option.attribution ?? null,
        sourceExerciseIds: uniqueStrings([
          spec.origin.exerciseId,
          ...(spec.checkpoints ?? []).map((checkpoint) => checkpoint.exerciseId),
          spec.destination.exerciseId
        ])
      },
      officialTfLTask: false
    }
  };
}

export function getExamRouteTaskMetadata(exercise: RouteExercise): ExamRouteTaskMetadata | null {
  return (exercise as Partial<ExamRouteExercise>).examRouteMetadata ?? null;
}

export function buildExamRoutePackMapOptions(
  options: readonly RouteRunnerMapOption[]
): RouteRunnerMapOption[] {
  const optionByMapId = new Map(options.map((option) => [option.map.id, option]));
  const missingMapIds = uniqueStrings(EXAM_ROUTE_TASK_SPECS.map((spec) => spec.mapId)).filter(
    (mapId) => !optionByMapId.has(mapId)
  );

  if (missingMapIds.length > 0) {
    throw new Error(`Exam route pack source map options are missing: ${missingMapIds.join(", ")}.`);
  }

  return options.map((option) => {
    const specs = EXAM_ROUTE_TASK_SPECS.filter((spec) => spec.mapId === option.map.id);

    if (specs.length === 0) {
      return option;
    }

    const existingIds = new Set(option.exercises.map((exercise) => exercise.id));
    const additions = specs.map((spec) => {
      if (existingIds.has(spec.id)) {
        throw new Error(`Exam route task ${spec.id} duplicates an existing exercise id.`);
      }

      return buildExamRouteExercise(option, spec);
    });

    return {
      ...option,
      exercises: [...option.exercises, ...additions]
    };
  });
}

export function listExamRouteTasks(options: readonly RouteRunnerMapOption[]): ExamRouteExercise[] {
  return options.flatMap((option) =>
    option.exercises.filter((exercise): exercise is ExamRouteExercise => getExamRouteTaskMetadata(exercise) !== null)
  );
}
