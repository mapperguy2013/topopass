import { victoriaWestminsterVauxhallOsmRouteRunnerMapOption } from "../../app/dev/route-runner/curatedVictoriaWestminsterVauxhallRouteRunnerMap.ts";
import {
  buildSyntheticBackgroundFeatures,
  buildSyntheticLandmarkVisuals,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  filterSyntheticBackgroundFeaturesForViewport,
  filterSyntheticLandmarkVisualsForViewport,
  filterSyntheticMapLabelsForViewport,
  syntheticLandmarkReservationBoxes,
  type SyntheticLabelPlacementDecision
} from "../../app/dev/route-runner/syntheticStreetMapRenderer.ts";
import {
  buildZoomedMapViewport,
  createDefaultMapViewportState,
  ROUTE_RUNNER_MAP_ZOOM_LIMITS
} from "../../app/dev/route-runner/mapViewport.ts";
import { getRouteRunnerMapViewportBounds } from "../../app/dev/route-runner/routeRunnerMapOptionUtils.ts";
import { mapToScreenPoint, type ScreenMapViewport } from "../../lib/map-engine/index.ts";

type Countable = Record<string, unknown>;

const option = victoriaWestminsterVauxhallOsmRouteRunnerMapOption;
const map = option.map;
const fixture = option.sourceOverpassFixture as {
  elements?: Array<{ type?: string; id?: number | string; tags?: Record<string, string> }>;
};
const backgroundFeatures = buildSyntheticBackgroundFeatures(map, { sourceOverpassFixture: fixture });
const linearFeatures = buildSyntheticLinearFeatures(map, { sourceOverpassFixture: fixture });
const labels = buildSyntheticMapLabels(map, undefined, {
  includeOsmRoadLabels: true,
  backgroundFeatures,
  linearFeatures,
  sourceOverpassFixture: fixture
});
const roadVisuals = buildSyntheticRoadVisuals(map);
const landmarkVisuals = buildSyntheticLandmarkVisuals(map, undefined, { sourceOverpassFixture: fixture });

function countBy<T extends Countable>(items: readonly T[], key: keyof T): Record<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const value = String(item[key] ?? "unknown");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right)));
}

function insideViewport(point: { x: number; y: number }, viewport: ScreenMapViewport): boolean {
  const screenPoint = mapToScreenPoint(point, viewport);
  return screenPoint.x >= 0 && screenPoint.x <= viewport.width && screenPoint.y >= 0 && screenPoint.y <= viewport.height;
}

function viewportReport(width: number, height: number, displayedZoom = 1) {
  const baseViewport = {
    width,
    height,
    mapBounds: getRouteRunnerMapViewportBounds(map, width, height)
  };
  const viewport = buildZoomedMapViewport(
    baseViewport,
    { ...createDefaultMapViewportState(ROUTE_RUNNER_MAP_ZOOM_LIMITS), zoom: displayedZoom },
    ROUTE_RUNNER_MAP_ZOOM_LIMITS
  );
  const initialDecisions: SyntheticLabelPlacementDecision[] = [];
  const initialLabels = filterSyntheticMapLabelsForViewport({
    labels,
    viewport,
    currentZoom: displayedZoom,
    onPlacementDecision: (decision) => initialDecisions.push(decision)
  });
  const placedSymbols = filterSyntheticLandmarkVisualsForViewport({
    visuals: landmarkVisuals,
    viewport,
    reservedLabels: initialLabels,
    currentZoom: displayedZoom
  });
  const finalDecisions: SyntheticLabelPlacementDecision[] = [];
  const placedLabels = filterSyntheticMapLabelsForViewport({
    labels,
    viewport,
    reservedBoxes: syntheticLandmarkReservationBoxes(placedSymbols, viewport, displayedZoom),
    currentZoom: displayedZoom,
    onPlacementDecision: (decision) => finalDecisions.push(decision)
  });
  const viewportLabels = labels.filter((label) => insideViewport(label.point, viewport));
  const viewportSymbols = landmarkVisuals.filter((visual) => insideViewport(visual.point, viewport));
  const visibleBackground = filterSyntheticBackgroundFeaturesForViewport(backgroundFeatures, viewport);

  return {
    viewport: { width, height, displayedZoom, mapBounds: viewport.mapBounds },
    candidates: {
      labels: countBy(viewportLabels, "kind"),
      background: countBy(visibleBackground, "kind"),
      symbols: countBy(viewportSymbols, "symbolKind")
    },
    displayed: {
      labels: countBy(placedLabels, "kind"),
      uniqueRoadNames: new Set(placedLabels.filter((label) => label.kind === "road").map((label) => label.text)).size,
      background: countBy(visibleBackground, "kind"),
      symbols: countBy(placedSymbols, "symbolKind")
    },
    labelDecisions: {
      beforeSymbolReservation: {
        accepted: initialDecisions.filter((decision) => decision.accepted).length,
        rejected: countBy(initialDecisions.filter((decision) => !decision.accepted), "reason")
      },
      accepted: finalDecisions.filter((decision) => decision.accepted).length,
      rejected: countBy(finalDecisions.filter((decision) => !decision.accepted), "reason")
    }
  };
}

const sourceElements = fixture.elements ?? [];
const uniqueSourceElements = Array.from(
  new Map(sourceElements.map((element) => [`${element.type}:${element.id}`, element])).values()
);
const sourceWays = uniqueSourceElements.filter((element) => element.type === "way");
const sourceNodes = uniqueSourceElements.filter((element) => element.type === "node");
const namedRoadWays = sourceWays.filter((element) => element.tags?.highway && element.tags.name);
const buildingWays = sourceWays.filter((element) => element.tags?.building);
const contextualElements = uniqueSourceElements.filter((element) => {
  const tags = element.tags ?? {};
  return Boolean(tags.amenity || tags.tourism || tags.leisure || tags.public_transport || tags.railway || tags.place);
});

console.log(JSON.stringify({
  source: {
    uniqueElements: uniqueSourceElements.length,
    nodes: sourceNodes.length,
    ways: sourceWays.length,
    namedRoadWays: namedRoadWays.length,
    buildingWays: buildingWays.length,
    contextualElements: contextualElements.length
  },
  adapted: {
    roads: countBy(roadVisuals, "osmHierarchy"),
    labels: countBy(labels, "kind"),
    background: countBy(backgroundFeatures, "kind"),
    symbols: countBy(landmarkVisuals, "symbolKind")
  },
  viewports: {
    productionCanvasLower: viewportReport(1120, 760, 0.8),
    productionCanvasPrincipal: viewportReport(1120, 760, 1),
    productionCanvasHigher: viewportReport(1120, 760, 1.25),
    learnerDesktopPrincipal: viewportReport(1920, 912, 1),
    learnerPhonePrincipal: viewportReport(900, 2160, 1)
  }
}, null, 2));
