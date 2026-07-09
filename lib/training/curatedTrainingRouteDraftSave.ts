import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CuratedTrainingRouteExport } from "./curatedTrainingRoutes.ts";

export const CURATED_TRAINING_ROUTE_ROOT_RELATIVE_DIR = "data/training-routes";
export const CURATED_TRAINING_ROUTE_DRAFTS_RELATIVE_DIR = "data/training-routes/drafts";
export const CURATED_TRAINING_ROUTE_STORAGE_RELATIVE_DIRS = [
  "data/training-routes/drafts",
  "data/training-routes/beta",
  "data/training-routes/approved",
  "data/training-routes/archive"
] as const;

export type CuratedTrainingRouteDraftSaveMode = "draft" | "validated-draft";

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
      message: "Training route draft saves must use application/json.",
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
      message: "Training route draft save request body must be valid JSON.",
      reasonCode: "invalid-json"
    };
  }

  if (!isRecord(body)) {
    return {
      ok: false,
      status: 400,
      message: "Training route draft save request body must be a JSON object.",
      reasonCode: "invalid-request-body"
    };
  }

  const saveMode = body.saveMode === "validated-draft" ? "validated-draft" : "draft";

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
      message: "Dev training route draft saves are disabled in production.",
      reasonCode: "dev-draft-save-disabled-in-production"
    };
  }

  const route = parseRouteInput(input.route);

  if (!route.ok) {
    return route;
  }

  const saveMode = input.saveMode ?? "draft";
  const validationErrors = validateCuratedTrainingRouteDraftPayload(route.value, saveMode);

  if (validationErrors.length > 0) {
    return {
      ok: false,
      status: 400,
      message:
        saveMode === "validated-draft"
          ? "Validated draft was not saved because the authored route is not ready for validated storage."
          : "Draft was not saved because required authored route data is missing.",
      reasonCode: "curated-training-route-draft-invalid",
      errors: validationErrors
    };
  }

  const routeId = readRouteId(route.value);
  const filenameSlug = sanitizeCuratedTrainingRouteDraftRouteId(routeId);

  if (!filenameSlug) {
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
  const draftsDir = path.resolve(workspaceRoot, ...CURATED_TRAINING_ROUTE_DRAFTS_RELATIVE_DIR.split("/"));

  await ensureCuratedTrainingRouteStorage(workspaceRoot);

  const draftPath = await resolveAvailableDraftPath({
    draftsDir,
    filenameSlug
  });

  if (!isPathInsideDirectory(draftsDir, draftPath.filePath)) {
    return {
      ok: false,
      status: 400,
      message: "Resolved draft path is outside the curated training route drafts directory.",
      reasonCode: "draft-path-outside-storage-root"
    };
  }

  const payload = withDraftTimestamps(route.value, savedAt);
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  try {
    await writeFile(draftPath.filePath, json, "utf8");
  } catch {
    return {
      ok: false,
      status: 500,
      message: "Training route draft could not be saved.",
      reasonCode: "draft-save-write-failed"
    };
  }

  return {
    ok: true,
    status: 200,
    message: "Training route draft saved.",
    filename: draftPath.filename,
    relativePath: draftRelativePath(draftPath.filename),
    filePath: draftPath.filePath,
    savedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    copiedFromExisting: draftPath.copiedFromExisting
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

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

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
      message: "Training route draft must include a route JSON object.",
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
  const validationSummary = readRecord(routeRecord.validationSummary);
  const shortestRouteComparison = readRecord(routeRecord.shortestRouteComparison);

  if (typeof metadata.routeId !== "string" || metadata.routeId.trim().length === 0) {
    errors.push("Route id is required.");
  }

  if (typeof start.nodeId !== "string" || start.nodeId.trim().length === 0) {
    errors.push("Start node is required.");
  }

  if (typeof destination.nodeId !== "string" || destination.nodeId.trim().length === 0) {
    errors.push("Destination node is required.");
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

  if (saveMode === "validated-draft") {
    if (validationSummary.valid !== true || validationSummary.status === "invalid") {
      errors.push("Validated drafts require a valid route validation summary.");
    }

    if (Array.isArray(validationSummary.blockingErrors) && validationSummary.blockingErrors.length > 0) {
      errors.push("Validated drafts cannot include blocking validation errors.");
    }

    const requiresRouteChoiceJustification = shortestRouteComparison.requiresRouteChoiceJustification === true;
    const routeChoiceJustification =
      typeof shortestRouteComparison.routeChoiceJustification === "string"
        ? shortestRouteComparison.routeChoiceJustification.trim()
        : "";

    if (requiresRouteChoiceJustification && routeChoiceJustification.length === 0) {
      errors.push("Validated drafts with a major detour warning require route choice justification.");
    }
  }

  return errors;
}

function readRouteId(route: CuratedTrainingRouteExport): string | null {
  const metadata = readRecord((route as Record<string, unknown>).metadata);

  return typeof metadata.routeId === "string" ? metadata.routeId : null;
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

async function resolveAvailableDraftPath(input: {
  draftsDir: string;
  filenameSlug: string;
}): Promise<{ filename: string; filePath: string; copiedFromExisting: boolean }> {
  for (let copyIndex = 0; copyIndex < 1000; copyIndex += 1) {
    const suffix = copyIndex === 0 ? "" : copyIndex === 1 ? "-copy" : `-copy-${copyIndex}`;
    const filename = `${input.filenameSlug}${suffix}.json`;
    const filePath = path.resolve(input.draftsDir, filename);

    if (!isPathInsideDirectory(input.draftsDir, filePath)) {
      throw new Error("Resolved draft path escaped the drafts directory.");
    }

    if (!(await fileExists(filePath))) {
      return {
        filename,
        filePath,
        copiedFromExisting: copyIndex > 0
      };
    }
  }

  throw new Error("Could not allocate a curated training route draft filename.");
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

function draftRelativePath(filename: string): string {
  return `${CURATED_TRAINING_ROUTE_DRAFTS_RELATIVE_DIR}/${filename}`;
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
