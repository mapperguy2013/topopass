# Stage 22D: Free OS/QGIS Atlas Map Workflow

## Decision

Move the long-term route-drawing base map workflow to pre-rendered local atlas
pages generated from free Ordnance Survey OpenData in QGIS.

This is not an A-Z clone project. Do not copy A-Z colours, typography, symbols,
page furniture, artwork, index design, branding, or trade dress. The target is
an original **London Driver Training Atlas** style that gives learners a similar
reading experience: dense street names, clear road hierarchy, labelled minor
roads, a printed-page feel, driver-focused overlays, and start/end route drawing.

Keep the existing generated OSM/SVG map as the working fallback until at least
one QGIS atlas page has been manually exported, reviewed, and aligned.

## Data Sources

### OS Open Zoomstack

Use OS Open Zoomstack as the main local base map dataset.

Role:

- road geometry and hierarchy
- buildings, rail, water, greenspace, urban context
- printable base cartography from national scale down to street detail

Relevant official documentation:

- https://docs.os.uk/os-downloads/products/maps-and-imagery-portfolio/os-open-zoomstack
- OS documents it as an OS OpenData product available via OS Data Hub.
- OS lists GeoPackage and vector tiles (MBTiles) as available formats.

### OS Open Names

Use OS Open Names as label and name enrichment data.

Role:

- road-name validation
- dense minor-road label enrichment where Zoomstack labels are insufficient
- future authoring/search workflows
- place names, road numbers, and postcode lookup

Relevant official documentation:

- https://docs.os.uk/os-downloads/products/addresses-and-names-portfolio/os-open-names
- OS lists CSV, GML, and GeoPackage formats.

### Existing OSM / Overpass Export

Keep OSM/Overpass data as a separate driver-access overlay, not as the primary
base map.

Use only where useful for:

- `oneway`
- `access`
- `vehicle`
- `motor_vehicle`
- `motorcar`
- `service`
- `junction`
- `barrier`
- private, pedestrian, no-motor, or restricted-access classification

Do not merge OSM into the OS base map until licensing and attribution handling
has been reviewed. OSM-derived overlays must remain attributable and separable.

## Legal And Product Rules

- No A-Z copyrighted map artwork or lookalike page design.
- No A-Z branding or naming.
- No OS premium datasets unless separately licensed.
- No online map APIs, online raster tiles, or online vector tile services in the
  learner app.
- Local generated assets are allowed when they come from permitted local data
  sources and carry attribution.
- Add OS attribution on or near atlas pages.
- Add OSM attribution when the OSM restriction overlay is shown or baked in.
- Record OS Open Zoomstack, OS Open Names, OSM extract, QGIS project, and export
  dates in the manifest.

## Target Architecture

Runtime learner app:

```txt
public/maps/atlas-pages/
  manifest.json
  kings-cross-euston-atlas.png      # only after real QGIS export exists
  kings-cross-euston-atlas.svg      # optional debug/export artifact
```

Code:

```txt
lib/map/atlasPages.ts
lib/map/atlasCoordinateTransform.ts
src/components/map/AtlasPageMap.tsx
src/components/route/RouteDrawingQuestion.tsx
src/data/routeQuestions.ts
```

Route question fields:

```ts
type RouteQuestion = {
  id: string;
  mapPageId?: string;
  mapBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  acceptedRoute?: {
    geometry: [number, number][];
    coordinateSystem: "map";
  };
};
```

`mapPageId` is optional. If it is missing, or if it points to a page that is not
in the manifest, the current generated SVG map remains the fallback.

## Atlas Manifest Contract

`public/maps/atlas-pages/manifest.json` is the app-facing index of local atlas
pages. It must not list a page until the matching exported image exists.

Shape:

```json
{
  "version": 1,
  "generatedBy": "manual-qgis-export",
  "pages": [
    {
      "id": "kings-cross-euston-atlas",
      "title": "King's Cross / Euston Driver Training Atlas",
      "imagePath": "/maps/atlas-pages/kings-cross-euston-atlas.png",
      "svgPath": "/maps/atlas-pages/kings-cross-euston-atlas.svg",
      "pixelWidth": 2400,
      "pixelHeight": 1600,
      "bounds": {
        "south": 51.516,
        "west": -0.15,
        "north": 51.536,
        "east": -0.1
      },
      "projectedBounds": {
        "crs": "EPSG:27700",
        "minX": 529000,
        "minY": 181000,
        "maxX": 532500,
        "maxY": 184000
      },
      "attribution": [
        "Contains OS data (c) Crown copyright and database right.",
        "Contains OpenStreetMap data (c) OpenStreetMap contributors."
      ],
      "dataVersions": {
        "osOpenZoomstack": "2026-06",
        "osOpenNames": "2026-07",
        "osmOverlay": "overpass export date"
      }
    }
  ]
}
```

Use `projectedBounds` from the QGIS map item where possible because the export
is produced in British National Grid (`EPSG:27700`). Keep WGS84 `bounds` as the
app-friendly geographic contract for future authoring and endpoint conversion.

## Coordinate Conversion

The app treats every atlas page as a fixed, non-rotated image with a pixel
coordinate space:

```txt
x = 0 at the left edge
y = 0 at the top edge
x = pixelWidth at the right edge
y = pixelHeight at the bottom edge
```

For WGS84 geographic bounds:

```txt
pageX = ((lng - west) / (east - west)) * pixelWidth
pageY = ((north - lat) / (north - south)) * pixelHeight
```

For projected OS grid bounds:

```txt
pageX = ((x - minX) / (maxX - minX)) * pixelWidth
pageY = ((maxY - y) / (maxY - minY)) * pixelHeight
```

The implemented helper functions are in `lib/map/atlasCoordinateTransform.ts`.
They support:

- geographic coordinate to page pixel
- page pixel to geographic coordinate
- projected coordinate to page pixel
- page pixel to projected coordinate
- page pixel bounds for scoring
- metres-per-pixel estimation for route scoring

## QGIS Production Plan

1. Download OS Open Zoomstack locally from OS Data Hub.
2. Download OS Open Names locally from OS Data Hub.
3. Load both into a QGIS project in `EPSG:27700`.
4. Style Zoomstack roads by hierarchy.
5. Use OS Open Names for dense road labels and selected place labels.
6. Add the existing OSM/Overpass restriction layer as a separate optional layer.
7. Create a print layout with a fixed map item extent.
8. Export one King's Cross / Euston test page as PNG.
9. Optionally export SVG for inspection, but use PNG as the stable app base map.
10. Copy the real export into `public/maps/atlas-pages/`.
11. Add a matching manifest entry with pixel size and bounds.
12. Add `mapPageId` to one route question only after the accepted route points
    have been aligned to that exported page's pixel space.

The exact manual QGIS workflow is documented in `docs/os-qgis-atlas-poc.md`.

## Current App State

Implemented support:

- `public/maps/atlas-pages/manifest.json` exists with no pages yet.
- `lib/map/atlasPages.ts` loads manifest page metadata.
- `lib/map/atlasCoordinateTransform.ts` provides page/pixel transforms.
- `src/components/map/AtlasPageMap.tsx` provides a reusable local atlas image
  base.
- `RouteDrawingQuestion` can draw over either an atlas page image or the current
  generated SVG fallback.
- `RoutePracticeFlow` and `RouteDemoFlow` resolve `mapPageId` when present.
- Current route drawing, scoring, accepted-route overlay, and fallback SVG map
  remain in place.

Not done yet:

- No QGIS project file is committed.
- No generated OS/QGIS atlas page image is committed.
- No route question has been moved to `mapPageId`.
- Accepted route geometries have not been transformed onto an atlas export.
- QGIS export is not automated in Codex.

## Acceptance Checklist

- Free/legal plan uses OS Open Zoomstack, OS Open Names, and optional separated
  OSM overlays.
- Runtime app uses local images only.
- Existing generated SVG map remains a fallback.
- No online map APIs or tile services are introduced.
- No A-Z copyrighted assets are used.
- The style is documented as original London Driver Training Atlas cartography.
- Atlas page pixel transforms are implemented and tested.
- No placeholder atlas page image is committed before a real QGIS export exists.
