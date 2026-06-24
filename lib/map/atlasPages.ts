import manifestJson from "../../public/maps/atlas-pages/manifest.json";
import {
  atlasPagePixelBounds,
  estimateAtlasMapUnitsToMeters,
  type AtlasGeographicBounds,
  type AtlasProjectedBounds
} from "./atlasCoordinateTransform.ts";
import type { RouteGraph } from "@/src/data/maps/routeTypes";

export type AtlasPageId = string;

export type AtlasPage = {
  id: AtlasPageId;
  title: string;
  imagePath: string;
  svgPath?: string;
  pixelWidth: number;
  pixelHeight: number;
  bounds: AtlasGeographicBounds;
  projectedBounds?: AtlasProjectedBounds | null;
  attribution: string[];
  source?: string;
  mapStyle?: string;
  exportedAt?: string;
  dataVersions?: {
    osOpenZoomstack?: string;
    osOpenNames?: string;
    osmOverlay?: string;
  };
  notes?: string;
};

export type AtlasPagesManifest = {
  version: 1;
  generatedBy?: string;
  notes?: string;
  pages: AtlasPage[];
};

export type RouteMapBase = {
  graph: RouteGraph;
  imagePath: string;
  atlasPage?: AtlasPage;
  mapAttribution?: string;
  scoringConfig?: {
    mapUnitsToMeters: number;
  };
};

export const atlasPagesManifest = manifestJson as AtlasPagesManifest;

export const atlasPages = atlasPagesManifest.pages;

export function getAtlasPageById(mapPageId?: string | null) {
  if (!mapPageId) {
    return undefined;
  }

  return atlasPages.find((page) => page.id === mapPageId);
}

export function atlasPageToRouteGraph(page: AtlasPage): RouteGraph {
  return {
    mapId: page.id,
    mapWidth: page.pixelWidth,
    mapHeight: page.pixelHeight,
    nodes: [],
    edges: []
  };
}

export function atlasPageToRouteMapBase(page: AtlasPage): RouteMapBase {
  return {
    graph: atlasPageToRouteGraph(page),
    imagePath: page.imagePath,
    atlasPage: page,
    mapAttribution: page.attribution.join(" "),
    scoringConfig: {
      mapUnitsToMeters: estimateAtlasMapUnitsToMeters(page)
    }
  };
}

export function atlasPageToRouteMapBounds(page: AtlasPage) {
  return atlasPagePixelBounds(page);
}
