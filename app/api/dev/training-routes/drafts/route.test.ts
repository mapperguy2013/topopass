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
import type { CuratedTrainingRouteExport } from "../../../../../lib/training/curatedTrainingRoutes.ts";
import {
  buildTrainingRouteAuthorModel,
  compareTrainingRouteAuthorShortestRoute,
  createSampleTrainingRouteAuthorState,
  validateTrainingRouteAuthorState
} from "../../../../dev/training-route/trainingRouteAuthor.ts";

test("dev curated route save rejects path traversal route ids", async () => {
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

test("working draft saves incomplete authoring JSON under drafts with draft status", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = incompleteWorkingDraftRoute(buildValidCuratedRouteExport());

  try {
    const result = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "working-draft",
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T09:30:00.000Z")
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(
      result.relativePath,
      "data/training-routes/drafts/real-london-intermediate-follow-planned-route-goodge-to-tottenham-draft.json"
    );
    assert.match(result.message, /Working draft saved/);
    assert.match(result.message, /data\/training-routes\/drafts\//);
    assert.ok(result.filePath.startsWith(path.join(workspaceRoot, "data", "training-routes", "drafts")));
    assert.equal(result.savedAt, "2026-07-09T09:30:00.000Z");

    const savedRoute = await readSavedRoute(result.filePath);

    assert.equal(savedRoute.createdAt, "2026-07-09T09:30:00.000Z");
    assert.equal(savedRoute.updatedAt, "2026-07-09T09:30:00.000Z");
    assert.equal(savedRoute.routeId, "real-london-intermediate-follow-planned-route-goodge-to-tottenham");
    assert.equal(savedRoute.metadata.routeId, "real-london-intermediate-follow-planned-route-goodge-to-tottenham");
    assert.equal(savedRoute.status, "draft");
    assert.equal(savedRoute.metadata.status, "draft");
    assert.equal(savedRoute.saveMode, "working-draft");
    assert.equal(savedRoute.lifecycleStage, "draft");
    assert.equal(savedRoute.title, "Goodge to Tottenham");
    assert.equal(savedRoute.area, "Real London");
    assert.equal(savedRoute.difficulty, "intermediate");
    assert.equal(savedRoute.exerciseType, "follow-planned-route");
    assert.deepEqual(savedRoute.routeSegmentIds, []);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("review candidate saves validated route under review with draft JSON status", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const result = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "review-candidate",
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T09:45:00.000Z")
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.match(result.relativePath, /^data\/training-routes\/review\//);
    assert.doesNotMatch(result.relativePath, /-draft\.json$/);
    assert.match(result.message, /Review candidate saved/);
    assert.match(result.message, new RegExp(escapeRegExp(result.relativePath)));
    assert.ok(result.filePath.startsWith(path.join(workspaceRoot, "data", "training-routes", "review")));

    const savedRoute = await readSavedRoute(result.filePath);

    assert.equal(savedRoute.status, "draft");
    assert.equal(savedRoute.metadata.status, "draft");
    assert.equal(savedRoute.saveMode, "review-candidate");
    assert.equal(savedRoute.lifecycleStage, "review");
    assert.ok(savedRoute.start.nodeId.length > 0);
    assert.ok(savedRoute.destination.nodeId.length > 0);
    assert.ok(savedRoute.routeSegmentIds.length > 0);
    assert.ok(savedRoute.validationSummary.valid);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("complete route saves under complete with learner-facing status and route metadata", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const result = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "complete-route",
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T10:00:00.000Z")
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.match(result.relativePath, /^data\/training-routes\/complete\//);
    assert.doesNotMatch(result.relativePath, /draft/);
    assert.match(result.message, /Complete route saved/);
    assert.match(result.message, new RegExp(escapeRegExp(result.relativePath)));
    assert.ok(result.filePath.startsWith(path.join(workspaceRoot, "data", "training-routes", "complete")));

    const savedRoute = await readSavedRoute(result.filePath);

    assert.equal(savedRoute.schemaVersion, 1);
    assert.equal(savedRoute.routeId, savedRoute.metadata.routeId);
    assert.equal(savedRoute.title, savedRoute.metadata.title);
    assert.equal(savedRoute.area, savedRoute.metadata.area);
    assert.equal(savedRoute.difficulty, savedRoute.metadata.difficulty);
    assert.equal(savedRoute.exerciseType, savedRoute.metadata.exerciseType);
    assert.equal(savedRoute.status, "beta");
    assert.equal(savedRoute.metadata.status, "beta");
    assert.equal(savedRoute.saveMode, "complete-route");
    assert.equal(savedRoute.lifecycleStage, "complete");
    assert.ok(Array.isArray(savedRoute.checkpoints));
    assert.ok(savedRoute.routeGeometry.length > 1);
    assert.equal(savedRoute.shortestRouteComparison.directComparison.comparisonStatus, "available");
    assert.ok(savedRoute.complexitySummary.segmentCount > 0);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("approved routes are blocked from drafts and saved only through complete route mode", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const baseRoute = buildValidCuratedRouteExport();
  const route = {
    ...baseRoute,
    metadata: {
      ...baseRoute.metadata,
      status: "approved" as const
    },
    status: "approved" as const
  };

  try {
    const draftResult = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "working-draft",
      workspaceRoot,
      nodeEnv: "development"
    });
    const completeResult = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "complete-route",
      workspaceRoot,
      nodeEnv: "development"
    });

    assert.equal(draftResult.ok, false);
    assert.equal(draftResult.status, 400);
    assert.equal(draftResult.reasonCode, "approved-route-draft-save-blocked");
    assert.match(draftResult.message, /Approved route cannot be saved to drafts/);
    assert.equal(completeResult.ok, true);
    assert.match(completeResult.relativePath, /^data\/training-routes\/complete\//);

    const savedRoute = await readSavedRoute(completeResult.filePath);

    assert.equal(savedRoute.status, "approved");
    assert.equal(savedRoute.metadata.status, "approved");
    assert.equal(savedRoute.saveMode, "complete-route");
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("dev curated route save creates a safe copy instead of overwriting an existing file", async () => {
  const workspaceRoot = await createTemporaryWorkspaceRoot();
  const route = buildValidCuratedRouteExport();

  try {
    const first = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "complete-route",
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T09:30:00.000Z")
    });
    const second = await saveCuratedTrainingRouteDraft({
      route,
      saveMode: "complete-route",
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

test("complete route save blocks missing route data and validation errors", async () => {
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
      saveMode: "complete-route",
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

test("dev curated route save is disabled in production", async () => {
  const result = await saveCuratedTrainingRouteDraft({
    route: buildValidCuratedRouteExport(),
    nodeEnv: "production"
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
  assert.equal(result.reasonCode, "dev-draft-save-disabled-in-production");
});

test("dev curated route save request returns saved path from POST JSON", async () => {
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
          saveMode: "complete-route",
          route
        })
      }),
      workspaceRoot,
      nodeEnv: "development",
      now: new Date("2026-07-09T10:00:00.000Z")
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.match(result.relativePath, /^data\/training-routes\/complete\//);
    assert.equal(result.savedAt, "2026-07-09T10:00:00.000Z");
    assert.match(result.message, new RegExp(escapeRegExp(result.relativePath)));
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function buildValidCuratedRouteExport(): CuratedTrainingRouteExport {
  const state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()));
  const model = buildTrainingRouteAuthorModel({ state });

  assert.equal(model.exportReadiness.ready, true);
  assert.equal(model.saveTargets.find((target) => target.mode === "complete-route")?.ready, true);

  return model.exportData;
}

function incompleteWorkingDraftRoute(route: CuratedTrainingRouteExport): CuratedTrainingRouteExport {
  return {
    ...route,
    routeId: "curated-training-route-draft",
    title: "Goodge to Tottenham",
    area: "Real London",
    difficulty: "intermediate",
    exerciseType: "follow-planned-route",
    status: "beta",
    metadata: {
      ...route.metadata,
      routeId: "curated-training-route-draft",
      title: "Goodge to Tottenham",
      area: "Real London",
      difficulty: "intermediate",
      exerciseType: "follow-planned-route",
      status: "beta"
    },
    start: {
      nodeId: "",
      label: "Start"
    },
    destination: {
      nodeId: "",
      label: "Destination"
    },
    checkpoints: [],
    routeSegmentIds: [],
    roadIds: [],
    nodeIds: [],
    routeGeometry: [],
    validationSegments: [],
    validationSummary: {
      ...route.validationSummary,
      status: "invalid",
      valid: false,
      blockingErrors: [],
      advisoryWarnings: [],
      affectedRouteSegmentIds: [],
      ruleCodes: [],
      explanation: "Validation has not been run for the current authored route."
    }
  };
}

async function readSavedRoute(filePath: string): Promise<CuratedTrainingRouteExport & { createdAt: string; updatedAt: string }> {
  const savedJson = await readFile(filePath, "utf8");

  assert.ok(savedJson.includes('\n  "metadata"'));
  assert.ok(savedJson.endsWith("\n"));

  return JSON.parse(savedJson) as CuratedTrainingRouteExport & { createdAt: string; updatedAt: string };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createTemporaryWorkspaceRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "topopass-training-route-saves-"));
}
