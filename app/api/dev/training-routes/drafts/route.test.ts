import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  handleCuratedTrainingRouteDraftSaveRequest,
  saveCuratedTrainingRouteDraft,
  sanitizeCuratedTrainingRouteDraftRouteId
} from "../../../../../lib/training/curatedTrainingRouteDraftSave.ts";
import {
  buildTrainingRouteAuthorModel,
  compareTrainingRouteAuthorShortestRoute,
  createSampleTrainingRouteAuthorState,
  validateTrainingRouteAuthorState
} from "../../../../dev/training-route/trainingRouteAuthor.ts";

test("dev curated route draft save rejects path traversal route ids", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const result = await saveCuratedTrainingRouteDraft({
      route: {
        ...route,
        metadata: {
          ...route.metadata,
          routeId: "../escape"
        }
      },
      workspaceRoot,
      nodeEnv: "development"
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(result.reasonCode, "unsafe-route-id");
    assert.equal(sanitizeCuratedTrainingRouteDraftRouteId("../escape"), null);
    assert.equal(sanitizeCuratedTrainingRouteDraftRouteId("..\\escape"), null);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("dev curated route draft save writes pretty JSON under drafts only", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const result = await saveCuratedTrainingRouteDraft({
      route,
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T09:30:00.000Z")
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.relativePath, `data/training-routes/drafts/${route.metadata.routeId}.json`);
    assert.ok(result.filePath.startsWith(path.join(workspaceRoot, "data", "training-routes", "drafts")));
    assert.equal(result.savedAt, "2026-07-09T09:30:00.000Z");

    const savedJson = await readFile(result.filePath, "utf8");
    const savedRoute = JSON.parse(savedJson) as typeof route & { createdAt: string; updatedAt: string };

    assert.ok(savedJson.includes('\n  "metadata"'));
    assert.ok(savedJson.endsWith("\n"));
    assert.equal(savedRoute.createdAt, "2026-07-09T09:30:00.000Z");
    assert.equal(savedRoute.updatedAt, "2026-07-09T09:30:00.000Z");
    assert.ok(savedRoute.start.nodeId.length > 0);
    assert.ok(savedRoute.destination.nodeId.length > 0);
    assert.ok(Array.isArray(savedRoute.checkpoints));
    assert.ok(savedRoute.routeSegmentIds.length > 0);
    assert.ok(savedRoute.validationSummary.valid);
    assert.ok(savedRoute.complexitySummary.segmentCount > 0);
    assert.equal(savedRoute.shortestRouteComparison.directComparison.comparisonStatus, "available");
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("dev curated route draft save creates a safe copy instead of overwriting an existing file", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const first = await saveCuratedTrainingRouteDraft({
      route,
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T09:30:00.000Z")
    });
    const second = await saveCuratedTrainingRouteDraft({
      route,
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T09:45:00.000Z")
    });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(first.relativePath.endsWith(".json"), true);
    assert.equal(second.relativePath.endsWith("-copy.json"), true);
    assert.equal(second.copiedFromExisting, true);
    assert.notEqual(first.filePath, second.filePath);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("validated curated route draft save blocks missing route data and validation errors", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const result = await saveCuratedTrainingRouteDraft({
      route: {
        ...route,
        routeSegmentIds: [],
        routeGeometry: [],
        validationSummary: {
          ...route.validationSummary,
          status: "invalid",
          valid: false,
          blockingErrors: [
            {
              code: "ROUTE_DISCONNECTED",
              affectedRouteSegmentIds: [],
              explanation: "The route is disconnected."
            }
          ]
        }
      },
      saveMode: "validated-draft",
      workspaceRoot,
      nodeEnv: "development"
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(result.reasonCode, "curated-training-route-draft-invalid");
    assert.ok(result.errors?.some((error) => error.includes("Route geometry")));
    assert.ok(result.errors?.some((error) => error.includes("Route segment ids")));
    assert.ok(result.errors?.some((error) => error.includes("valid route validation")));
    assert.ok(result.errors?.some((error) => error.includes("blocking validation errors")));
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("dev curated route draft save is disabled in production", async () => {
  const result = await saveCuratedTrainingRouteDraft({
    route: buildValidCuratedRouteExport(),
    nodeEnv: "production"
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
  assert.equal(result.reasonCode, "dev-draft-save-disabled-in-production");
});

test("dev curated route draft save request returns saved path from POST JSON", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const result = await handleCuratedTrainingRouteDraftSaveRequest({
      request: new Request("http://localhost/api/dev/training-routes/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          saveMode: "validated-draft",
          route
        })
      }),
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T10:00:00.000Z")
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.relativePath, `data/training-routes/drafts/${route.metadata.routeId}.json`);
    assert.equal(result.savedAt, "2026-07-09T10:00:00.000Z");
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function buildValidCuratedRouteExport() {
  const state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()));
  const model = buildTrainingRouteAuthorModel({ state });

  assert.equal(model.exportReadiness.ready, true);
  assert.equal(model.validatedDraftSaveReadiness.ready, true);

  return model.exportData;
}

async function createTemporaryWorkspaceRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "topopass-training-route-drafts-"));
}
