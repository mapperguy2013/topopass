import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CuratedTrainingRouteExport,
  CuratedTrainingRouteStatus
} from "./curatedTrainingRoutes.ts";
import {
  CURATED_TRAINING_ROUTE_SAVE_MODE_DIRECTORIES,
  curatedTrainingRouteFilename,
  effectiveCuratedTrainingRouteId,
  lifecycleStageForCuratedTrainingRouteSaveMode,
  normaliseCuratedTrainingRouteSaveMode,
  slugifyCuratedTrainingRouteValue,
  statusForCuratedTrainingRouteSaveMode,
  type CuratedTrainingRouteSaveMode
} from "./curatedTrainingRouteSaveNaming.ts";

export const CURATED_TRAINING_ROUTE_ROOT_RELATIVE_DIR = "data/training-routes";
export const CURATED_TRAINING_ROUTE_DRAFTS_RELATIVE_DIR = "data/training-routes/drafts";
export const CURATED_TRAINING_ROUTE_STORAGE_RELATIVE_DIRS = [
  "data/training-routes/drafts",
  "data/training-routes/review",
  "data/training-routes/complete",
  "data/training-routes/beta",
  "data/training-routes/approved",
  "data/training-routes/archive"
] as const;

export type CuratedTrainingRouteDraftSaveMode = CuratedTrainingRouteSaveMode;

export type CuratedTrainingRouteDraftSaveSuccess = {
  ok: true;
  status: 200;
  message: string;
  filename: string;
  relativePath: string;
  filePath: string;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  copiedFromExisting: boolean;
};

export type CuratedTrainingRouteDraftSaveFailure = {
  ok: false;
  status: 400 | 403 | 405 | 415 | 500;
  message: string;
  reasonCode: string;
  errors?: string[];
};

export type CuratedTrainingRouteDraftSaveResult =
  | CuratedTrainingRouteDraftSaveSuccess
  | CuratedTrainingRouteDraftSaveFailure;

export async function handleCuratedTrainingRouteDraftSaveRequest(input: {
  request: Request;
  nodeEnv?: string;
  workspaceRoot?: string;
  now?: Date;
}): Promise<CuratedTrainingRouteDraftSaveResult> {
  if (input.request.method !== "POST") {
    return methodNotAllowed();
  }

  if (!hasJsonContentType(input.request.headers)) {
    return {
      ok: false,
      status: 415,
      message: "Training route saves must use application/json.",
      reasonCode: "unsupported-content-type"
    };
  }

  let body: unknown;

  try {
    body = JSON.parse(await input.request.text());
  } catch {
    return {
      ok: false,
      status: 400,
      message: "Training route save request body must be valid JSON.",
      reasonCode: "invalid-json"
    };
  }

  if (!isRecord(body)) {
    return {
      ok: false,
      status: 400,
      message: "Training route save request body must be a JSON object.",
      reasonCode: "invalid-request-body"
    };
  }

  const saveMode = normaliseCuratedTrainingRouteSaveMode(body.saveMode);

  return saveCuratedTrainingRouteDraft({
    route: body.route,
    saveMode,
    nodeEnv: input.nodeEnv,
    workspaceRoot: input.workspaceRoot,
    now: input.now
  });
}

export async function saveCuratedTrainingRouteDraft(input: {
  route: unknown;
  saveMode?: CuratedTrainingRouteDraftSaveMode;
  nodeEnv?: string;
  workspaceRoot?: string;
  now?: Date;
}): Promise<CuratedTrainingRouteDraftSaveResult> {
  if ((input.nodeEnv ?? process.env.NODE_ENV) === "production") {
    return {
      ok: false,
      status: 403,
      message: "Dev training route saves are disabled in production.",
      reasonCode: "dev-draft-save-disabled-in-production"
    };
  }

  const route = parseRouteInput(input.route);

  if (!route.ok) {
    return route;
  }

  const saveMode = normaliseCuratedTrainingRouteSaveMode(input.saveMode);

  if (saveMode === "working-draft" && readRouteStatus(route.value) === "approved") {
    return {
      ok: false,
      status: 400,
      message: "Approved route cannot be saved to drafts. Use Save complete route instead.",
      reasonCode: "approved-route-draft-save-blocked",
      errors: ["Approved routes must be saved with Save complete route, not Save working draft."]
    };
  }

  const normalisedRoute = withSaveModeRouteMetadata(route.value, saveMode);
  const validationErrors = validateCuratedTrainingRouteDraftPayload(normalisedRoute, saveMode);

  if (validationErrors.length > 0) {
    return {
      ok: false,
      status: 400,
      message: saveFailureMessage(saveMode),
      reasonCode: "curated-training-route-draft-invalid",
      errors: validationErrors
    };
  }

  if (hasUnsafeRouteId(readRouteId(route.value))) {
    return {
      ok: false,
      status: 400,
      message: "Route id must be a safe file name without path separators or traversal.",
      reasonCode: "unsafe-route-id",
      errors: ["Route id cannot contain path separators, drive prefixes, or path traversal."]
    };
  }

  const now = input.now ?? new Date();
  const savedAt = now.toISOString();
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  const targetRelativeDir = CURATED_TRAINING_ROUTE_SAVE_MODE_DIRECTORIES[saveMode];
  const targetDir = path.resolve(workspaceRoot, ...targetRelativeDir.split("/"));

  await ensureCuratedTrainingRouteStorage(workspaceRoot);

  const savePath = await resolveAvailableSavePath({
    targetDir,
    filename: curatedTrainingRouteFilename({
      metadata: normalisedRoute.metadata,
      saveMode
    })
  });

  if (!isPathInsideDirectory(targetDir, savePath.filePath)) {
    return {
      ok: false,
      status: 400,
      message: "Resolved save path is outside the curated training route storage directory.",
      reasonCode: "draft-path-outside-storage-root"
    };
  }

  const payload = withDraftTimestamps(normalisedRoute, savedAt);
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  try {
    await writeFile(savePath.filePath, json, "utf8");
  } catch {
    return {
      ok: false,
      status: 500,
      message: "Training route could not be saved.",
      reasonCode: "draft-save-write-failed"
    };
  }

  return {
    ok: true,
    status: 200,
    message: saveSuccessMessage(saveMode, `${targetRelativeDir}/${savePath.filename}`),
    filename: savePath.filename,
    relativePath: `${targetRelativeDir}/${savePath.filename}`,
    filePath: savePath.filePath,
    savedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    copiedFromExisting: savePath.copiedFromExisting
  };
}

export function sanitizeCuratedTrainingRouteDraftRouteId(routeId: string | null): string | null {
  const trimmed = routeId?.trim();

  if (!trimmed) {
    return null;
  }

  if (
    trimmed.includes("..") ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes(":") ||
    path.isAbsolute(trimmed)
  ) {
    return null;
  }

  const slug = slugifyCuratedTrainingRouteValue(trimmed).slice(0, 120);

  return slug.length > 0 ? slug : null;
}

function methodNotAllowed(): CuratedTrainingRouteDraftSaveFailure {
  return {
    ok: false,
    status: 405,
    message: "Unsupported method. Use POST.",
    reasonCode: "unsupported-method"
  };
}

function hasJsonContentType(headers: Headers): boolean {
  const contentType = headers.get("content-type");

  return Boolean(contentType?.toLowerCase().includes("application/json"));
}

function parseRouteInput(route: unknown):
  | { ok: true; value: CuratedTrainingRouteExport }
  | CuratedTrainingRouteDraftSaveFailure {
  if (typeof route === "string") {
    try {
      const parsed = JSON.parse(route) as unknown;

      if (isRecord(parsed)) {
        return { ok: true, value: parsed as CuratedTrainingRouteExport };
      }
    } catch {
      return {
        ok: false,
        status: 400,
        message: "Route JSON must be valid JSON.",
        reasonCode: "invalid-route-json"
      };
    }
  }

  if (!isRecord(route)) {
    return {
      ok: false,
      status: 400,
      message: "Training route save must include a route JSON object.",
      reasonCode: "missing-route-json"
    };
  }

  return { ok: true, value: route as CuratedTrainingRouteExport };
}

function validateCuratedTrainingRouteDraftPayload(
  route: CuratedTrainingRouteExport,
  saveMode: CuratedTrainingRouteDraftSaveMode
): string[] {
  const errors: string[] = [];
  const routeRecord = route as Record<string, unknown>;
  const metadata = readRecord(routeRecord.metadata);
  const start = readRecord(routeRecord.start);
  const destination = readRecord(routeRecord.destination);
  const checkpointRequirements = readRecord(routeRecord.checkpointRequirements);
  const validationSummary = readRecord(routeRecord.validationSummary);
  const shortestRouteComparison = readRecord(routeRecord.shortestRouteComparison);

  if (typeof metadata.routeId !== "string" || metadata.routeId.trim().length === 0) {
    errors.push("Route id is required.");
  }

  if (typeof metadata.title !== "string" || metadata.title.trim().length === 0) {
    errors.push("Title is required.");
  }

  if (!hasSelectedTrainingRouteAreaMetadata(metadata)) {
    errors.push("Select a practice map or training area.");
  }

  if (saveMode === "working-draft") {
    return errors;
  }

  if (typeof metadata.area !== "string" || metadata.area.trim().length === 0) {
    errors.push("Area is required.");
  }

  if (typeof metadata.difficulty !== "string" || metadata.difficulty.trim().length === 0) {
    errors.push("Difficulty is required.");
  }

  if (typeof metadata.exerciseType !== "string" || metadata.exerciseType.trim().length === 0) {
    errors.push("Exercise type is required.");
  }

  if (typeof metadata.objective !== "string" || metadata.objective.trim().length === 0) {
    errors.push("Objective is required.");
  }

  if (typeof start.nodeId !== "string" || start.nodeId.trim().length === 0) {
    errors.push("Start node is required.");
  }

  if (typeof destination.nodeId !== "string" || destination.nodeId.trim().length === 0) {
    errors.push("Destination node is required.");
  }

  if (checkpointRequirements.required === true && !isArrayWithMinimum(routeRecord.checkpoints, 1)) {
    errors.push("At least one required checkpoint is missing.");
  }

  if (!isArrayWithMinimum(routeRecord.routeGeometry, 2)) {
    errors.push("Route geometry must include at least two points.");
  }

  if (!isArrayWithMinimum(routeRecord.routeSegmentIds, 1)) {
    errors.push("Route segment ids are required.");
  }

  if (!isArrayWithMinimum(routeRecord.nodeIds, 2)) {
    errors.push("Route node ids must include at least start and destination.");
  }

  if (!isRecord(routeRecord.validationSummary)) {
    errors.push("Validation summary is required.");
  }

  if (!isRecord(routeRecord.complexitySummary)) {
    errors.push("Complexity summary is required.");
  }

  if (!isRecord(routeRecord.shortestRouteComparison)) {
    errors.push("Shortest-route comparison summary is required.");
  }

  if (validationHasNotRun(validationSummary)) {
    errors.push("Validation has not run.");
  }

  if (saveMode === "complete-route") {
    if (validationSummary.valid !== true || validationSummary.status === "invalid") {
      errors.push("Complete routes require a valid route validation summary.");
    }

    if (Array.isArray(validationSummary.blockingErrors) && validationSummary.blockingErrors.length > 0) {
      errors.push("Complete routes cannot include blocking validation errors.");
    }

    if (!shortestRouteComparisonHasRun(shortestRouteComparison)) {
      errors.push("Shortest-route comparison has not run.");
    }

    const requiresRouteChoiceJustification = shortestRouteComparison.requiresRouteChoiceJustification === true;
    const routeChoiceJustification =
      typeof shortestRouteComparison.routeChoiceJustification === "string"
        ? shortestRouteComparison.routeChoiceJustification.trim()
        : "";

    if (requiresRouteChoiceJustification && routeChoiceJustification.length === 0) {
      errors.push("Complete routes with a major detour warning require route choice justification.");
    }

    const status = typeof metadata.status === "string" ? metadata.status : "";

    if (status !== "beta" && status !== "approved") {
      errors.push("Complete routes require beta or approved status.");
    }
  }

  return errors;
}

function withSaveModeRouteMetadata(
  route: CuratedTrainingRouteExport,
  saveMode: CuratedTrainingRouteSaveMode
): CuratedTrainingRouteExport {
  const metadata = readRecord((route as Record<string, unknown>).metadata) as CuratedTrainingRouteExport["metadata"];
  const currentStatus: CuratedTrainingRouteStatus =
    metadata.status === "beta" || metadata.status === "approved" || metadata.status === "draft"
      ? metadata.status
      : "draft";
  const sourceMetadata = {
    ...metadata,
    routeId: effectiveCuratedTrainingRouteId(metadata),
    status: statusForCuratedTrainingRouteSaveMode({
      saveMode,
      status: currentStatus
    })
  };

  return {
    ...route,
    routeId: sourceMetadata.routeId,
    title: sourceMetadata.title,
    area: sourceMetadata.area,
    practiceMapId: sourceMetadata.practiceMapId,
    areaId: sourceMetadata.areaId,
    areaName: sourceMetadata.areaName,
    sourceFixture: sourceMetadata.sourceFixture,
    difficulty: sourceMetadata.difficulty,
    exerciseType: sourceMetadata.exerciseType,
    status: sourceMetadata.status,
    saveMode,
    lifecycleStage: lifecycleStageForCuratedTrainingRouteSaveMode(saveMode),
    metadata: sourceMetadata
  };
}

function hasSelectedTrainingRouteAreaMetadata(metadata: Record<string, unknown>): boolean {
  const area = typeof metadata.area === "string" ? metadata.area.trim() : "";
  const areaId = typeof metadata.areaId === "string" ? metadata.areaId.trim() : "";
  const areaName = typeof metadata.areaName === "string" ? metadata.areaName.trim() : "";
  const practiceMapId = typeof metadata.practiceMapId === "string" ? metadata.practiceMapId.trim() : "";

  return Boolean(areaId && areaName && practiceMapId && area === areaName);
}

function hasUnsafeRouteId(routeId: string | null): boolean {
  const trimmed = routeId?.trim();

  if (!trimmed) {
    return false;
  }

  return sanitizeCuratedTrainingRouteDraftRouteId(trimmed) === null;
}

function validationHasNotRun(validationSummary: Record<string, unknown>): boolean {
  const explanation = typeof validationSummary.explanation === "string" ? validationSummary.explanation.toLowerCase() : "";

  return explanation.includes("validation has not been run");
}

function shortestRouteComparisonHasRun(shortestRouteComparison: Record<string, unknown>): boolean {
  const directComparison = readRecord(shortestRouteComparison.directComparison);
  const explanation = typeof directComparison.explanation === "string" ? directComparison.explanation.toLowerCase() : "";

  return !explanation.includes("has not been run");
}

function saveFailureMessage(saveMode: CuratedTrainingRouteSaveMode): string {
  if (saveMode === "complete-route") {
    return "Complete route could not be saved because required checks are missing.";
  }

  if (saveMode === "review-candidate") {
    return "Review candidate could not be saved because required route data is missing.";
  }

  return "Working draft could not be saved because required route metadata is missing.";
}

function saveSuccessMessage(saveMode: CuratedTrainingRouteSaveMode, relativePath: string): string {
  if (saveMode === "complete-route") {
    return `Complete route saved. Path: ${relativePath}`;
  }

  if (saveMode === "review-candidate") {
    return `Review candidate saved. Path: ${relativePath}`;
  }

  return `Working draft saved. Path: ${relativePath}`;
}

function readRouteId(route: CuratedTrainingRouteExport): string | null {
  const metadata = readRecord((route as Record<string, unknown>).metadata);

  return typeof metadata.routeId === "string" ? metadata.routeId : null;
}

function readRouteStatus(route: CuratedTrainingRouteExport): CuratedTrainingRouteStatus | null {
  const metadata = readRecord((route as Record<string, unknown>).metadata);

  return metadata.status === "draft" || metadata.status === "beta" || metadata.status === "approved"
    ? metadata.status
    : null;
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isArrayWithMinimum(value: unknown, minimumLength: number): boolean {
  return Array.isArray(value) && value.length >= minimumLength;
}

async function ensureCuratedTrainingRouteStorage(workspaceRoot: string): Promise<void> {
  await Promise.all(
    CURATED_TRAINING_ROUTE_STORAGE_RELATIVE_DIRS.map((relativeDir) =>
      mkdir(path.resolve(workspaceRoot, ...relativeDir.split("/")), { recursive: true })
    )
  );
}

async function resolveAvailableSavePath(input: {
  targetDir: string;
  filename: string;
}): Promise<{ filename: string; filePath: string; copiedFromExisting: boolean }> {
  const parsedPath = path.parse(input.filename);
  const baseName = parsedPath.name;
  const extension = parsedPath.ext || ".json";

  for (let copyIndex = 0; copyIndex < 1000; copyIndex += 1) {
    const suffix = copyIndex === 0 ? "" : copyIndex === 1 ? "-copy" : `-copy-${copyIndex}`;
    const filename = `${baseName}${suffix}${extension}`;
    const filePath = path.resolve(input.targetDir, filename);

    if (!isPathInsideDirectory(input.targetDir, filePath)) {
      throw new Error("Resolved save path escaped the target directory.");
    }

    if (!(await fileExists(filePath))) {
      return {
        filename,
        filePath,
        copiedFromExisting: copyIndex > 0
      };
    }
  }

  throw new Error("Could not allocate a curated training route filename.");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isPathInsideDirectory(parentDir: string, childPath: string): boolean {
  const relative = path.relative(parentDir, childPath);

  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function withDraftTimestamps(
  route: CuratedTrainingRouteExport,
  savedAt: string
): CuratedTrainingRouteExport & { createdAt: string; updatedAt: string } {
  const routeRecord = route as CuratedTrainingRouteExport & {
    createdAt?: unknown;
    updatedAt?: unknown;
  };

  return {
    ...route,
    createdAt: typeof routeRecord.createdAt === "string" ? routeRecord.createdAt : savedAt,
    updatedAt: savedAt
  };
}
