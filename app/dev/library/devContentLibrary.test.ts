import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildDevContentLibraryModel,
  handleDevContentLibraryActionRequest,
  validateRouteImportPreview
} from "./devContentLibrary.ts";

const VALID_ROUTE_PATH = "data/training-routes/complete/real-london-beginner-follow-chenies-street.json";

test("/dev/library page source renders the dev content library sections", async () => {
  const pageSource = await readFile("app/dev/library/page.tsx", "utf8");

  assert.match(pageSource, /Dev Content Library/);
  assert.match(pageSource, /Routes/);
  assert.match(pageSource, /Maps/);
  assert.match(pageSource, /Imports/);
  assert.match(pageSource, /Archive/);
  assert.match(pageSource, /Diagnostics/);
});

test("dev content library model lists route files across drafts review complete and archive", async () => {
  const workspace = await createRouteWorkspace();
  const routeJson = await readFile(VALID_ROUTE_PATH, "utf8");

  try {
    await writeFile(path.join(workspace, "data/training-routes/drafts/sample-draft.json"), routeJson, "utf8");
    await writeFile(path.join(workspace, "data/training-routes/review/sample-review.json"), routeJson, "utf8");
    await writeFile(path.join(workspace, "data/training-routes/complete/sample-complete.json"), routeJson, "utf8");
    await writeFile(path.join(workspace, "data/training-routes/archive/sample-archive.json"), routeJson, "utf8");

    const model = await buildDevContentLibraryModel({ workspaceRoot: workspace });

    assert.equal(model.path, "/dev/library");
    assert.equal(model.linkedFromLearnerNavigation, false);
    assert.equal(model.diagnostics.draftCount, 1);
    assert.equal(model.diagnostics.reviewCount, 1);
    assert.equal(model.diagnostics.completeCount, 1);
    assert.equal(model.diagnostics.archivedCount, 1);
    assert.ok(model.routes.some((route) => route.folder === "complete" && route.filename === "sample-complete.json"));
    assert.ok(model.routes.every((route) => route.actions.includes("Archive route") || route.actions.includes("Restore from archive")));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("dev content library map registry lists unsupported maps without marking them authoring-ready", async () => {
  const model = await buildDevContentLibraryModel();
  const unsupportedMaps = model.maps.filter((map) => !map.authoringSupported);
  const realLondon = model.maps.find((map) => map.mapId === "osm-real-london-pilot");

  assert.ok(realLondon);
  assert.equal(realLondon.authoringSupported, true);
  assert.ok(unsupportedMaps.length > 0);
  assert.ok(unsupportedMaps.every((map) => map.unsupportedReason));
  assert.ok(model.diagnostics.unsupportedMaps.length >= unsupportedMaps.length);
});

test("route import preview rejects invalid complete route payloads", () => {
  const preview = validateRouteImportPreview({
    targetFolder: "complete",
    route: {
      routeId: "broken-route",
      metadata: {
        routeId: "broken-route",
        title: "Broken route",
        status: "draft"
      }
    }
  });

  assert.equal(preview.ok, false);
  assert.ok(preview.errors.some((error) => /Complete imports require beta or approved status/.test(error)));
  assert.ok(preview.errors.some((error) => /Map\/area metadata is required/.test(error)));
});

test("complete beta route import saves safely and reports manifest status", async () => {
  const workspace = await createRouteWorkspace();
  const route = JSON.parse(await readFile(VALID_ROUTE_PATH, "utf8")) as unknown;

  try {
    const result = await handleDevContentLibraryActionRequest({
      request: jsonRequest({
        operation: "import-route",
        targetFolder: "complete",
        route
      }),
      workspaceRoot: workspace,
      nodeEnv: "development"
    });

    assert.equal(result.ok, true);
    assert.equal(result.operation, "import-route");
    assert.equal(result.manifestAction, "manual-update-required");
    assert.match(result.relativePath ?? "", /^data\/training-routes\/complete\/.+\.json$/);
    assert.match(result.manifestSnippet ?? "", /with \{ type: "json" \}/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("archive route moves files under archive instead of deleting", async () => {
  const workspace = await createRouteWorkspace();
  const sourceRelativePath = "data/training-routes/complete/route-to-archive.json";
  const sourcePath = path.join(workspace, ...sourceRelativePath.split("/"));
  const routeJson = await readFile(VALID_ROUTE_PATH, "utf8");

  try {
    await writeFile(sourcePath, routeJson, "utf8");

    const result = await handleDevContentLibraryActionRequest({
      request: jsonRequest({
        operation: "archive-route",
        relativePath: sourceRelativePath
      }),
      workspaceRoot: workspace,
      nodeEnv: "development"
    });

    assert.equal(result.ok, true);
    assert.equal(result.operation, "archive-route");
    assert.equal(result.relativePath, "data/training-routes/archive/route-to-archive.json");
    await assert.rejects(access(sourcePath));
    await access(path.join(workspace, "data/training-routes/archive/route-to-archive.json"));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("dev content library file writes reject path traversal", async () => {
  const workspace = await createRouteWorkspace();

  try {
    const result = await handleDevContentLibraryActionRequest({
      request: jsonRequest({
        operation: "archive-route",
        relativePath: "data/training-routes/complete/../../package.json"
      }),
      workspaceRoot: workspace,
      nodeEnv: "development"
    });

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, "unsafe-route-path");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("map import rejects unknown unsupported formats", async () => {
  const result = await handleDevContentLibraryActionRequest({
    request: jsonRequest({
      operation: "validate-map-import",
      map: {
        mapId: "invented-map",
        sourceFixturePath: "invented.json"
      }
    }),
    nodeEnv: "development"
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, "unsupported-map-format");
});

async function createRouteWorkspace(): Promise<string> {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "topopass-library-test-"));

  await Promise.all(
    ["drafts", "review", "complete", "archive"].map((folder) =>
      mkdir(path.join(workspace, "data/training-routes", folder), { recursive: true })
    )
  );

  return workspace;
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/dev/library", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}
