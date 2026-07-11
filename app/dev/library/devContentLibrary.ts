import { readdir, readFile, mkdir, rename, access } from "node:fs/promises";
import path from "node:path";
import {
  LEARNER_TRAINING_SUPPORTED_CURATED_MAP_IDS,
  CURATED_LEARNER_ROUTE_PACK_FILES,
  buildCuratedTrainingRouteVisibilityDiagnostics,
  normaliseCuratedTrainingRouteExport
} from "../../../lib/training/curatedLearnerRoutePack.ts";
import {
  CURATED_TRAINING_ROUTE_STORAGE_RELATIVE_DIRS,
  saveCuratedTrainingRouteDraft
} from "../../../lib/training/curatedTrainingRouteDraftSave.ts";
import type { CuratedTrainingRouteExport } from "../../../lib/training/curatedTrainingRoutes.ts";
import type { CuratedTrainingRouteSaveMode } from "../../../lib/training/curatedTrainingRouteSaveNaming.ts";
import {
  TRAINING_ROUTE_AUTHOR_AREA_OPTIONS,
  TRAINING_ROUTE_AUTHOR_MAP_REGISTRY,
  type TrainingRouteAuthorMapRegistryEntry
} from "../training-route/trainingRouteAuthor.ts";

export type DevContentLibraryTab = "routes" | "maps" | "imports" | "archive" | "diagnostics";
export type DevContentLibraryRouteFolder = "drafts" | "review" | "complete" | "archive";
export type DevContentLibraryRouteTarget = "drafts" | "review" | "complete";
export type DevContentLibraryValidationStatus = "valid" | "warning" | "invalid" | "not-run" | "unknown";

export type DevContentLibraryRouteRecord = {
  filename: string;
  folder: DevContentLibraryRouteFolder;
  relativePath: string;
  routeId: string;
  title: string;
  areaName: string;
  mapId: string;
  difficulty: string;
  exerciseType: string;
  status: string;
  saveMode: string;
  lifecycleStage: string;
  checkpointCount: number;
  validationStatus: DevContentLibraryValidationStatus;
  learnerFacing: boolean;
  learnerExclusionReasons: string[];
  manifestIncluded: boolean;
  lastUpdated: string | null;
  parseErrors: string[];
  actions: string[];
};

export type DevContentLibraryMapRecord = {
  mapId: string;
  areaId: string;
  displayName: string;
  areaName: string;
  sourceFixturePath: string;
  mapType: string;
  authoringSupported: boolean;
  learnerSupported: boolean;
  status: string;
  defaultViewportLabel: string;
  routeCount: number;
  unsupportedReason: string | null;
  actions: string[];
};

export type DevContentLibraryDiagnostics = {
  totalRouteFiles: number;
  draftCount: number;
  reviewCount: number;
  completeCount: number;
  archivedCount: number;
  learnerFacingRouteCount: number;
  manifestIncludedCount: number;
  manifestMissingCompleteRoutes: string[];
  excludedRoutes: Array<{ routeId: string; reasons: string[]; message: string }>;
  totalMaps: number;
  authoringSupportedMapCount: number;
  unsupportedMaps: Array<{ mapId: string; reason: string }>;
  manifestHealth: "healthy" | "needs-route-manifest-update" | "has-schema-errors";
  schemaValidationErrors: string[];
};

export type DevContentLibraryModel = {
  path: "/dev/library";
  title: "Dev Content Library";
  description: string;
  devOnlyNotice: string;
  tabs: Array<{ id: DevContentLibraryTab; label: string }>;
  routes: DevContentLibraryRouteRecord[];
  maps: DevContentLibraryMapRecord[];
  diagnostics: DevContentLibraryDiagnostics;
  filters: {
    routeStatuses: string[];
    routeDifficulties: string[];
    routeExerciseTypes: string[];
    routeMapIds: string[];
    routeValidationStatuses: string[];
    mapStatuses: string[];
    mapSourceTypes: string[];
  };
  importTargets: DevContentLibraryRouteTarget[];
  manifestUpdateInstructions: string[];
  linkedFromLearnerNavigation: false;
};

export type DevContentLibraryActionResult =
  | {
      ok: true;
      status: 200;
      operation: "import-route" | "archive-route" | "restore-route" | "validate-map-import";
      message: string;
      relativePath?: string;
      manifestAction?: "already-included" | "manual-update-required" | "not-learner-facing";
      manifestSnippet?: string;
    }
  | {
      ok: false;
      status: 400 | 403 | 405 | 415 | 500;
      operation?: string;
      message: string;
      reasonCode: string;
      errors?: string[];
    };

const ROUTE_FOLDER_RELATIVE_DIRS: Record<DevContentLibraryRouteFolder, string> = {
  drafts: "data/training-routes/drafts",
  review: "data/training-routes/review",
  complete: "data/training-routes/complete",
  archive: "data/training-routes/archive"
};

const ROUTE_TARGET_SAVE_MODES: Record<DevContentLibraryRouteTarget, CuratedTrainingRouteSaveMode> = {
  drafts: "working-draft",
  review: "review-candidate",
  complete: "complete-route"
};

const DEV_CONTENT_LIBRARY_TABS: DevContentLibraryModel["tabs"] = [
  { id: "routes", label: "Routes" },
  { id: "maps", label: "Maps" },
  { id: "imports", label: "Imports" },
  { id: "archive", label: "Archive" },
  { id: "diagnostics", label: "Diagnostics" }
];

const ROUTE_MANIFEST_FILENAMES = new Set(CURATED_LEARNER_ROUTE_PACK_FILES.map((entry) => entry.filename));

export async function buildDevContentLibraryModel(input: {
  workspaceRoot?: string;
} = {}): Promise<DevContentLibraryModel> {
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  await ensureRouteFolders(workspaceRoot);

  const routes = await readDevContentLibraryRouteRecords(workspaceRoot);
  const maps = buildDevContentLibraryMapRecords(routes);
  const diagnostics = buildDevContentLibraryDiagnostics(routes, maps);

  return {
    path: "/dev/library",
    title: "Dev Content Library",
    description: "Manage import, organisation, archive, and diagnostics for curated routes and authoring-supported maps.",
    devOnlyNotice:
      "Development content tooling only. This page is not linked from learner navigation and file writes are disabled in production.",
    linkedFromLearnerNavigation: false,
    tabs: DEV_CONTENT_LIBRARY_TABS,
    routes,
    maps,
    diagnostics,
    filters: {
      routeStatuses: uniqueSorted(routes.map((route) => route.status)),
      routeDifficulties: uniqueSorted(routes.map((route) => route.difficulty)),
      routeExerciseTypes: uniqueSorted(routes.map((route) => route.exerciseType)),
      routeMapIds: uniqueSorted(routes.map((route) => route.mapId)),
      routeValidationStatuses: uniqueSorted(routes.map((route) => route.validationStatus)),
      mapStatuses: uniqueSorted(maps.map((map) => map.status)),
      mapSourceTypes: uniqueSorted(maps.map((map) => map.mapType))
    },
    importTargets: ["drafts", "review", "complete"],
    manifestUpdateInstructions: buildManifestUpdateInstructions(routes)
  };
}

export async function handleDevContentLibraryActionRequest(input: {
  request: Request;
  nodeEnv?: string;
  workspaceRoot?: string;
}): Promise<DevContentLibraryActionResult> {
  if (input.request.method !== "POST") {
    return {
      ok: false,
      status: 405,
      message: "Unsupported method. Use POST.",
      reasonCode: "unsupported-method"
    };
  }

  if (!input.request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      status: 415,
      message: "Content library actions must use application/json.",
      reasonCode: "unsupported-content-type"
    };
  }

  if ((input.nodeEnv ?? process.env.NODE_ENV) === "production") {
    return {
      ok: false,
      status: 403,
      message: "Dev content library file writes are disabled in production.",
      reasonCode: "dev-content-library-disabled-in-production"
    };
  }

  let body: unknown;

  try {
    body = JSON.parse(await input.request.text());
  } catch {
    return {
      ok: false,
      status: 400,
      message: "Content library request body must be valid JSON.",
      reasonCode: "invalid-json"
    };
  }

  if (!isRecord(body)) {
    return {
      ok: false,
      status: 400,
      message: "Content library request body must be an object.",
      reasonCode: "invalid-request-body"
    };
  }

  const operation = stringValue(body.operation);
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  await ensureRouteFolders(workspaceRoot);

  if (operation === "import-route") {
    return importRouteFromLibraryRequest(body, workspaceRoot, input.nodeEnv);
  }

  if (operation === "archive-route") {
    return moveRouteForLibraryRequest({
      body,
      workspaceRoot,
      operation: "archive-route",
      targetFolder: "archive"
    });
  }

  if (operation === "restore-route") {
    const targetFolder = normaliseRouteTarget(body.targetFolder);

    if (!targetFolder) {
      return {
        ok: false,
        status: 400,
        operation,
        message: "Restore target folder must be drafts, review, or complete.",
        reasonCode: "invalid-restore-target"
      };
    }

    return moveRouteForLibraryRequest({
      body,
      workspaceRoot,
      operation: "restore-route",
      targetFolder
    });
  }

  if (operation === "validate-map-import") {
    return validateMapImportDescriptor(body.map);
  }

  return {
    ok: false,
    status: 400,
    operation,
    message: "Unsupported content library operation.",
    reasonCode: "unsupported-operation"
  };
}

export function validateRouteImportPreview(input: {
  route: unknown;
  targetFolder: DevContentLibraryRouteTarget;
}): { ok: boolean; errors: string[]; route?: CuratedTrainingRouteExport; learnerFacing?: boolean } {
  if (!isRecord(input.route)) {
    return {
      ok: false,
      errors: ["Route import must be a JSON object."]
    };
  }

  const route = normaliseCuratedTrainingRouteExport(input.route);
  const errors: string[] = [];

  if (!route.metadata.routeId.trim() && !route.routeId.trim()) {
    errors.push("Route id is required.");
  }

  if (!route.title.trim() && !route.metadata.title.trim()) {
    errors.push("Title is required.");
  }

  if (!route.areaId.trim() || !route.areaName.trim() || !route.practiceMapId.trim()) {
    errors.push("Map/area metadata is required.");
  }

  if (input.targetFolder !== "drafts") {
    if (!route.start.nodeId.trim()) {
      errors.push("Review and complete routes require a start node.");
    }

    if (!route.destination.nodeId.trim()) {
      errors.push("Review and complete routes require a destination node.");
    }

    if (route.routeGeometry.length < 2 || route.routeSegmentIds.length === 0) {
      errors.push("Review and complete routes require route geometry and segment ids.");
    }
  }

  if (input.targetFolder === "complete") {
    if (route.status !== "beta" && route.status !== "approved") {
      errors.push("Complete imports require beta or approved status.");
    }

    if (route.validationSummary.status === "invalid" || route.validationSummary.blockingErrors.length > 0) {
      errors.push("Complete imports cannot include blocking validation errors.");
    }
  }

  const learnerFacing = buildCuratedTrainingRouteVisibilityDiagnostics({ routes: [route] }).excludedRoutes.length === 0;

  return {
    ok: errors.length === 0,
    errors,
    route,
    learnerFacing
  };
}

function buildDevContentLibraryDiagnostics(
  routes: DevContentLibraryRouteRecord[],
  maps: DevContentLibraryMapRecord[]
): DevContentLibraryDiagnostics {
  const manifestMissingCompleteRoutes = routes
    .filter((route) => route.folder === "complete" && route.learnerFacing && !route.manifestIncluded)
    .map((route) => route.filename);
  const schemaValidationErrors = routes.flatMap((route) =>
    route.parseErrors.map((error) => `${route.relativePath}: ${error}`)
  );

  return {
    totalRouteFiles: routes.length,
    draftCount: routes.filter((route) => route.folder === "drafts").length,
    reviewCount: routes.filter((route) => route.folder === "review").length,
    completeCount: routes.filter((route) => route.folder === "complete").length,
    archivedCount: routes.filter((route) => route.folder === "archive").length,
    learnerFacingRouteCount: routes.filter((route) => route.learnerFacing).length,
    manifestIncludedCount: routes.filter((route) => route.manifestIncluded).length,
    manifestMissingCompleteRoutes,
    excludedRoutes: routes
      .filter((route) => !route.learnerFacing && route.routeId !== "(unreadable)")
      .map((route) => ({
        routeId: route.routeId,
        reasons: route.learnerExclusionReasons,
        message: route.learnerExclusionReasons.join(", ") || "Route is not learner-facing."
      })),
    totalMaps: maps.length,
    authoringSupportedMapCount: maps.filter((map) => map.authoringSupported).length,
    unsupportedMaps: maps
      .filter((map) => !map.authoringSupported)
      .map((map) => ({
        mapId: map.mapId,
        reason: map.unsupportedReason ?? "Unsupported for authoring."
      })),
    manifestHealth:
      schemaValidationErrors.length > 0
        ? "has-schema-errors"
        : manifestMissingCompleteRoutes.length > 0
          ? "needs-route-manifest-update"
          : "healthy",
    schemaValidationErrors
  };
}

async function readDevContentLibraryRouteRecords(workspaceRoot: string): Promise<DevContentLibraryRouteRecord[]> {
  const records: DevContentLibraryRouteRecord[] = [];

  for (const folder of Object.keys(ROUTE_FOLDER_RELATIVE_DIRS) as DevContentLibraryRouteFolder[]) {
    const relativeDir = ROUTE_FOLDER_RELATIVE_DIRS[folder];
    const absoluteDir = path.resolve(workspaceRoot, ...relativeDir.split("/"));
    let filenames: string[] = [];

    try {
      filenames = (await readdir(absoluteDir)).filter((filename) => filename.endsWith(".json")).sort();
    } catch {
      filenames = [];
    }

    for (const filename of filenames) {
      records.push(await readRouteRecord({ workspaceRoot, folder, relativeDir, filename }));
    }
  }

  return records.sort((a, b) => `${a.folder}/${a.filename}`.localeCompare(`${b.folder}/${b.filename}`));
}

async function readRouteRecord(input: {
  workspaceRoot: string;
  folder: DevContentLibraryRouteFolder;
  relativeDir: string;
  filename: string;
}): Promise<DevContentLibraryRouteRecord> {
  const relativePath = `${input.relativeDir}/${input.filename}`;
  const absolutePath = path.resolve(input.workspaceRoot, ...relativePath.split("/"));

  try {
    const raw = await readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const route = normaliseCuratedTrainingRouteExport(parsed);
    const diagnostics = buildCuratedTrainingRouteVisibilityDiagnostics({ routes: [route] });
    const excluded = diagnostics.excludedRoutes[0];
    const routeRecord = isRecord(parsed) ? parsed : {};
    const lastUpdated = stringValue(routeRecord.updatedAt) || stringValue(routeRecord.createdAt) || null;

    return {
      filename: input.filename,
      folder: input.folder,
      relativePath,
      routeId: route.routeId || route.metadata.routeId || "(missing route id)",
      title: route.title || route.metadata.title || "(untitled route)",
      areaName: route.areaName || route.metadata.areaName || route.area || "(missing area)",
      mapId: route.mapId || route.practiceMapId || "(missing map)",
      difficulty: route.difficulty || "(missing difficulty)",
      exerciseType: route.exerciseType || "(missing exercise type)",
      status: route.status || "(missing status)",
      saveMode: route.saveMode ?? "(missing save mode)",
      lifecycleStage: route.lifecycleStage || "(missing lifecycle)",
      checkpointCount: route.checkpoints.length,
      validationStatus: normaliseValidationStatus(route.validationSummary.status),
      learnerFacing: !excluded,
      learnerExclusionReasons: excluded?.reasons ?? [],
      manifestIncluded: input.folder === "complete" && ROUTE_MANIFEST_FILENAMES.has(input.filename),
      lastUpdated,
      parseErrors: [],
      actions: routeActions(input.folder, route.mapId)
    };
  } catch (error) {
    return {
      filename: input.filename,
      folder: input.folder,
      relativePath,
      routeId: "(unreadable)",
      title: "(invalid JSON)",
      areaName: "(unknown)",
      mapId: "(unknown)",
      difficulty: "(unknown)",
      exerciseType: "(unknown)",
      status: "(unknown)",
      saveMode: "(unknown)",
      lifecycleStage: "(unknown)",
      checkpointCount: 0,
      validationStatus: "unknown",
      learnerFacing: false,
      learnerExclusionReasons: ["schema-error"],
      manifestIncluded: false,
      lastUpdated: null,
      parseErrors: [error instanceof Error ? error.message : "Route JSON could not be parsed."],
      actions: ["View details", "Archive route"]
    };
  }
}

function buildDevContentLibraryMapRecords(routes: DevContentLibraryRouteRecord[]): DevContentLibraryMapRecord[] {
  const routeCounts = new Map<string, number>();

  for (const route of routes) {
    if (route.mapId && !route.mapId.startsWith("(")) {
      routeCounts.set(route.mapId, (routeCounts.get(route.mapId) ?? 0) + 1);
    }
  }

  return TRAINING_ROUTE_AUTHOR_MAP_REGISTRY.map((entry) => mapRecordFromRegistryEntry(entry, routeCounts)).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

function mapRecordFromRegistryEntry(
  entry: TrainingRouteAuthorMapRegistryEntry,
  routeCounts: ReadonlyMap<string, number>
): DevContentLibraryMapRecord {
  const authoringOption = TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.find((option) => option.mapId === entry.mapId);

  return {
    mapId: entry.mapId,
    areaId: entry.areaId,
    displayName: entry.displayName,
    areaName: entry.areaName,
    sourceFixturePath: entry.sourceFixturePath ?? entry.sourceFixtureId ?? "none",
    mapType: entry.mapType,
    authoringSupported: entry.routeAuthoringSupported,
    learnerSupported: LEARNER_TRAINING_SUPPORTED_CURATED_MAP_IDS.has(entry.mapId),
    status: entry.status,
    defaultViewportLabel: formatBounds(entry.defaultViewport),
    routeCount: routeCounts.get(entry.mapId) ?? 0,
    unsupportedReason: entry.unsupportedReason ?? null,
    actions: mapActions(Boolean(authoringOption), entry.routeAuthoringSupported)
  };
}

function routeActions(folder: DevContentLibraryRouteFolder, mapId: string): string[] {
  const base = ["View details", "Validate", "Copy JSON", "Download JSON"];
  const canOpenInAuthor = TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.some((option) => option.mapId === mapId);

  if (folder === "archive") {
    return [...base, "Restore from archive"];
  }

  return [
    ...base,
    "Move to drafts",
    "Move to review",
    "Move to complete",
    "Archive route",
    ...(canOpenInAuthor ? ["Open in /dev/training-route"] : [])
  ];
}

function mapActions(hasAuthoringOption: boolean, authoringSupported: boolean): string[] {
  return [
    "View details",
    "Validate map entry",
    authoringSupported ? "Disable for authoring" : "Enable for authoring",
    "Archive map entry",
    "Restore map entry",
    ...(hasAuthoringOption ? ["Open in /dev/training-route"] : [])
  ];
}

async function importRouteFromLibraryRequest(
  body: Record<string, unknown>,
  workspaceRoot: string,
  nodeEnv?: string
): Promise<DevContentLibraryActionResult> {
  const targetFolder = normaliseRouteTarget(body.targetFolder);

  if (!targetFolder) {
    return {
      ok: false,
      status: 400,
      operation: "import-route",
      message: "Import target folder must be drafts, review, or complete.",
      reasonCode: "invalid-import-target"
    };
  }

  const preview = validateRouteImportPreview({
    route: body.route,
    targetFolder
  });

  if (!preview.ok || !preview.route) {
    return {
      ok: false,
      status: 400,
      operation: "import-route",
      message: "Route import failed validation.",
      reasonCode: "route-import-invalid",
      errors: preview.errors
    };
  }

  const saved = await saveCuratedTrainingRouteDraft({
    route: preview.route,
    saveMode: ROUTE_TARGET_SAVE_MODES[targetFolder],
    nodeEnv,
    workspaceRoot
  });

  if (!saved.ok) {
    return {
      ...saved,
      operation: "import-route"
    };
  }

  const filename = path.basename(saved.relativePath);
  const manifestIncluded = ROUTE_MANIFEST_FILENAMES.has(filename);
  const manifestAction =
    targetFolder !== "complete" || !preview.learnerFacing
      ? "not-learner-facing"
      : manifestIncluded
        ? "already-included"
        : "manual-update-required";

  return {
    ok: true,
    status: 200,
    operation: "import-route",
    message:
      manifestAction === "manual-update-required"
        ? `${saved.message} Add this route to CURATED_LEARNER_ROUTE_PACK_FILES before learners can see it.`
        : saved.message,
    relativePath: saved.relativePath,
    manifestAction,
    manifestSnippet:
      manifestAction === "manual-update-required" && preview.route
        ? manifestSnippetForRoute(filename, preview.route.routeId)
        : undefined
  };
}

async function moveRouteForLibraryRequest(input: {
  body: Record<string, unknown>;
  workspaceRoot: string;
  operation: "archive-route" | "restore-route";
  targetFolder: DevContentLibraryRouteFolder | DevContentLibraryRouteTarget;
}): Promise<DevContentLibraryActionResult> {
  const relativePath = stringValue(input.body.relativePath);
  const source = resolveAllowedTrainingRoutePath(input.workspaceRoot, relativePath);

  if (!source.ok) {
    return {
      ok: false,
      status: 400,
      operation: input.operation,
      message: source.message,
      reasonCode: source.reasonCode
    };
  }

  const targetDir = path.resolve(input.workspaceRoot, ...ROUTE_FOLDER_RELATIVE_DIRS[input.targetFolder].split("/"));
  const targetPath = await resolveAvailableMovePath({
    workspaceRoot: input.workspaceRoot,
    targetDir,
    filename: path.basename(source.absolutePath)
  });

  try {
    await mkdir(targetDir, { recursive: true });
    await rename(source.absolutePath, targetPath.absolutePath);
  } catch {
    return {
      ok: false,
      status: 500,
      operation: input.operation,
      message: "Route file could not be moved.",
      reasonCode: "route-move-failed"
    };
  }

  return {
    ok: true,
    status: 200,
    operation: input.operation,
    message:
      input.operation === "archive-route"
        ? `Route archived to ${targetPath.relativePath}.`
        : `Route restored to ${targetPath.relativePath}.`,
    relativePath: targetPath.relativePath,
    manifestAction: input.operation === "archive-route" ? "not-learner-facing" : undefined
  };
}

function validateMapImportDescriptor(map: unknown): DevContentLibraryActionResult {
  if (!isRecord(map)) {
    return {
      ok: false,
      status: 400,
      operation: "validate-map-import",
      message: "Map import must be a JSON object descriptor.",
      reasonCode: "unsupported-map-format",
      errors: ["Supported map imports must describe an existing registered map fixture."]
    };
  }

  const mapId = stringValue(map.mapId);
  const fixture = stringValue(map.sourceFixturePath) || stringValue(map.sourceFixtureId);
  const registryEntry = TRAINING_ROUTE_AUTHOR_MAP_REGISTRY.find((entry) => entry.mapId === mapId);

  if (!mapId || !fixture) {
    return {
      ok: false,
      status: 400,
      operation: "validate-map-import",
      message: "Map descriptor is missing required mapId or source fixture fields.",
      reasonCode: "map-descriptor-missing-fields",
      errors: ["Required fields: mapId, sourceFixturePath or sourceFixtureId."]
    };
  }

  if (!registryEntry) {
    return {
      ok: false,
      status: 400,
      operation: "validate-map-import",
      message: "Unknown map source. Add a real route-runner map option before importing map metadata.",
      reasonCode: "unsupported-map-format",
      errors: ["The library manager does not accept arbitrary unknown map formats."]
    };
  }

  if (!registryEntry.routeAuthoringSupported) {
    return {
      ok: true,
      status: 200,
      operation: "validate-map-import",
      message: `Map descriptor is registered but unsupported for authoring: ${registryEntry.unsupportedReason ?? "unsupported"}.`,
      manifestAction: "not-learner-facing"
    };
  }

  return {
    ok: true,
    status: 200,
    operation: "validate-map-import",
    message: "Map descriptor matches an existing authoring-supported registry entry. Registry updates are manual and dev-only.",
    manifestAction: "manual-update-required"
  };
}

function resolveAllowedTrainingRoutePath(
  workspaceRoot: string,
  relativePath: string
):
  | { ok: true; absolutePath: string; relativePath: string }
  | { ok: false; message: string; reasonCode: string } {
  const normalised = relativePath.replace(/\\/g, "/");

  if (!normalised.endsWith(".json") || normalised.includes("..") || path.isAbsolute(normalised)) {
    return {
      ok: false,
      message: "Route path must be a JSON file inside data/training-routes.",
      reasonCode: "unsafe-route-path"
    };
  }

  const allowedPrefix = Object.values(ROUTE_FOLDER_RELATIVE_DIRS).find((relativeDir) =>
    normalised.startsWith(`${relativeDir}/`)
  );

  if (!allowedPrefix) {
    return {
      ok: false,
      message: "Route path is outside the approved training route folders.",
      reasonCode: "route-path-outside-allowed-folders"
    };
  }

  const absolutePath = path.resolve(workspaceRoot, ...normalised.split("/"));
  const root = path.resolve(workspaceRoot, "data", "training-routes");
  const relativeToRoot = path.relative(root, absolutePath);

  if (!relativeToRoot || relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return {
      ok: false,
      message: "Route path escaped the training routes root.",
      reasonCode: "route-path-escaped-root"
    };
  }

  return {
    ok: true,
    absolutePath,
    relativePath: normalised
  };
}

async function resolveAvailableMovePath(input: {
  workspaceRoot: string;
  targetDir: string;
  filename: string;
}): Promise<{ absolutePath: string; relativePath: string }> {
  const parsed = path.parse(input.filename);

  for (let index = 0; index < 1000; index += 1) {
    const suffix = index === 0 ? "" : index === 1 ? "-copy" : `-copy-${index}`;
    const candidateFilename = `${parsed.name}${suffix}${parsed.ext || ".json"}`;
    const absolutePath = path.resolve(input.targetDir, candidateFilename);

    if (!(await fileExists(absolutePath))) {
      const relativePath = path.relative(input.workspaceRoot, absolutePath).replace(/\\/g, "/");

      return {
        absolutePath,
        relativePath
      };
    }
  }

  throw new Error("Unable to allocate archive path.");
}

function buildManifestUpdateInstructions(routes: DevContentLibraryRouteRecord[]): string[] {
  return routes
    .filter((route) => route.folder === "complete" && route.learnerFacing && !route.manifestIncluded)
    .map((route) => manifestSnippetForRoute(route.filename, route.routeId));
}

function manifestSnippetForRoute(filename: string, routeId: string): string {
  const importName = `route${routeId
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}`;

  return `import ${importName} from "../../data/training-routes/complete/${filename}" with { type: "json" };`;
}

async function ensureRouteFolders(workspaceRoot: string): Promise<void> {
  await Promise.all(
    CURATED_TRAINING_ROUTE_STORAGE_RELATIVE_DIRS.map((relativeDir) =>
      mkdir(path.resolve(workspaceRoot, ...relativeDir.split("/")), { recursive: true })
    )
  );
}

function normaliseRouteTarget(value: unknown): DevContentLibraryRouteTarget | null {
  return value === "drafts" || value === "review" || value === "complete" ? value : null;
}

function normaliseValidationStatus(value: string): DevContentLibraryValidationStatus {
  if (value === "valid" || value === "warning" || value === "invalid" || value === "not-run") {
    return value;
  }

  return "unknown";
}

function formatBounds(bounds: TrainingRouteAuthorMapRegistryEntry["defaultViewport"]): string {
  return `${Math.round(bounds.minX)},${Math.round(bounds.minY)} to ${Math.round(bounds.maxX)},${Math.round(bounds.maxY)}`;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort();
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
