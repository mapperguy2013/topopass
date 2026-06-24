# OS/QGIS Atlas Page Proof Of Concept

This document defines the manual proof-of-concept workflow for creating one
local **London Driver Training Atlas** page from OS OpenData in QGIS.

The output must be an original training atlas page. It should be dense and
print-like, but it must not copy A-Z artwork, colours, symbols, page furniture,
type treatment, branding, or trade dress.

## Inputs

Use only local files:

```txt
data/maps/os/open-zoomstack/
data/maps/os/open-names/
data/maps/osm-overlays/
maps/qgis/
public/maps/atlas-pages/
```

Do not fetch map data at runtime. Do not add online basemap APIs or tile
services.

## 1. Download OS Open Zoomstack

1. Go to the official OS Open Zoomstack documentation:
   https://docs.os.uk/os-downloads/products/maps-and-imagery-portfolio/os-open-zoomstack
2. Follow the OS Data Hub download link for the OpenData product.
3. Sign in or create the required free OS Data Hub account if prompted.
4. Choose the latest OS Open Zoomstack download.
5. Prefer `GeoPackage` for QGIS styling. `MBTiles` vector tiles are acceptable
   for later experiments, but GeoPackage is easier for this POC.
6. Download and extract to:

```txt
data/maps/os/open-zoomstack/
```

Expected useful layers include roads, buildings, rail, water, greenspace, and
other contextual basemap features. Names vary by release, so inspect the layer
list in QGIS before writing any automation.

## 2. Download OS Open Names

1. Go to the official OS Open Names documentation:
   https://docs.os.uk/os-downloads/products/addresses-and-names-portfolio/os-open-names
2. Follow the OS Data Hub download link for the OpenData product.
3. Choose `GeoPackage` if available. Use CSV only if GeoPackage is not available
   for the downloaded package.
4. Download and extract to:

```txt
data/maps/os/open-names/
```

Use Open Names for road-name validation and dense label enrichment. It is not a
full address dataset.

## 3. Prepare Existing OSM Access Overlay

Use the existing local Overpass/OSM workflow only for restriction overlays.

Useful tags:

```txt
oneway
access
vehicle
motor_vehicle
motorcar
service
junction
barrier
```

Store the exported or processed overlay at:

```txt
data/maps/osm-overlays/kings-cross-euston-access.geojson
```

The overlay can be either:

- baked into the QGIS export for learner-facing clarity
- exported as a separate app overlay for admin/debug review

For the first POC, bake only high-confidence one-way and no-motor restrictions.
Unknown access should remain visually neutral.

## 4. Create The QGIS Project

1. Open QGIS.
2. Create a new project:

```txt
maps/qgis/london-driver-training-atlas.qgz
```

3. Set project CRS to `EPSG:27700 - OSGB36 / British National Grid`.
4. Add the OS Open Zoomstack GeoPackage:
   `Layer > Add Layer > Add Vector Layer`.
5. Add OS Open Names:
   `Layer > Add Layer > Add Vector Layer` for GeoPackage, or
   `Layer > Add Layer > Add Delimited Text Layer` for CSV.
6. Add the OSM access GeoJSON as a separate top layer if available.
7. Save the project.

Keep all source data local. Do not add web XYZ, WMS, WMTS, Mapbox, Google,
Apple, Bing, or OS API layers.

## 5. Select The Test Page Extent

Use one local test page covering King's Cross, Euston, and nearby Bloomsbury.

Start with the existing generated-map geographic bounds:

```json
{
  "south": 51.516,
  "west": -0.15,
  "north": 51.536,
  "east": -0.1
}
```

In QGIS:

1. Add a temporary rectangle layer for the page extent, or use the map canvas
   coordinate tool to set a similar extent.
2. Transform the WGS84 bounds to `EPSG:27700` for the print layout map item.
3. Keep the map item north-up with no rotation.
4. Record the final map item extent in `EPSG:27700`. This becomes
   `projectedBounds` in the manifest.

## 6. Style The Road Hierarchy

Use original TopoPass styling. The goal is readable driver training, not a clone
of a commercial atlas.

Suggested layer order:

1. land/background
2. water
3. greenspace
4. rail
5. buildings
6. minor roads casing
7. minor roads fill
8. local/side roads casing
9. local/side roads fill
10. secondary/tertiary roads casing
11. secondary/tertiary roads fill
12. primary/A-road casing
13. primary/A-road fill
14. road labels
15. selected place labels
16. OSM one-way/restriction overlay
17. page frame and attribution

Suggested visual hierarchy:

```txt
Primary/A roads:       pale warm yellow fill, darker tan casing, widest stroke
Secondary roads:       light cream fill, medium grey/tan casing
Tertiary/local roads:  white fill, fine grey casing
Service roads:         very light grey fill, thin casing
Pedestrian/no motor:   muted grey dashed overlay where confirmed
Rail:                  thin dark neutral lines, visually below roads
Buildings:             light neutral grey, low contrast
Greenspace:            muted green, low saturation
Water:                 restrained blue-grey
```

Avoid:

- A-Z-like palette matching
- A-Z-style road shields
- copied symbols or page furniture
- overly modern online-navigation styling
- large marketing-map visual treatments

## 7. Configure Dense Labels

In QGIS, configure labels in `Layer Styling > Labels`.

Road labels:

1. Use road-name attributes from Zoomstack where present.
2. Add Open Names as a separate label source for missing minor-road names.
3. Use curved/parallel line placement for road labels.
4. Enable repeat labels along long roads.
5. Allow smaller labels for minor roads, but keep them readable at export size.
6. Use a light halo rather than heavy label boxes.
7. Increase label priority for:
   - A roads and key distributor roads
   - stations and major junctions
   - start/end training areas
8. Lower label priority for:
   - pedestrian-only paths
   - service alleys
   - duplicate place names
9. Use scale-based visibility so labels do not overwhelm the page.

Starting label settings:

```txt
Major road labels: 8.5-9.5 pt, semibold, dark neutral, 1.0 pt pale halo
Local road labels: 6.0-7.0 pt, regular, dark neutral, 0.8 pt pale halo
Place labels:      8.0-10 pt, semibold, dark neutral, sparse
```

Use QGIS label conflict tools first. Do not hand-place labels until the automated
rules are close.

## 8. Configure The Print Layout

1. Open `Project > New Print Layout`.
2. Name it:

```txt
kings-cross-euston-atlas-poc
```

3. Set page size. Use landscape A4 for the first POC.
4. Add a map item covering most of the page.
5. Set the map item CRS to project CRS (`EPSG:27700`).
6. Set the map item extent to the recorded King's Cross / Euston extent.
7. Lock layers and styles for the map item.
8. Add a small title such as:

```txt
London Driver Training Atlas - King's Cross / Euston
```

9. Add a small attribution footer:

```txt
Contains OS data (c) Crown copyright and database right.
Contains OpenStreetMap data (c) OpenStreetMap contributors.
```

10. Do not add A-Z branding, sheet numbers, grid/index furniture, or copied page
    motifs.

## 9. Export One Local Test Page

QGIS supports print layout export as image and SVG, and atlas generation from a
coverage layer. For the first POC, export one page manually before automating.

PNG export:

1. In the print layout, click `Layout > Export as Image`.
2. Choose PNG.
3. Use 300 DPI for print-like quality.
4. Disable crop-to-content unless the manifest bounds are recalculated from the
   cropped output.
5. Save as:

```txt
public/maps/atlas-pages/kings-cross-euston-atlas.png
```

SVG export, optional:

1. Click `Layout > Export as SVG`.
2. Export map layers as SVG groups if useful for inspection.
3. Save as:

```txt
public/maps/atlas-pages/kings-cross-euston-atlas.svg
```

Use PNG as the app base map unless SVG rendering is visually verified in the
browser.

## 10. Capture Pixel Dimensions

After export, record exact pixel dimensions.

Options:

- Windows file properties
- image editor metadata
- QGIS export dialog dimensions
- ImageMagick if installed:

```txt
magick identify public/maps/atlas-pages/kings-cross-euston-atlas.png
```

Record:

```json
{
  "pixelWidth": 0,
  "pixelHeight": 0
}
```

Replace zeros with the real exported dimensions.

## 11. Update The Manifest

Only after the image exists, add a page entry to:

```txt
public/maps/atlas-pages/manifest.json
```

Example:

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
      "mapStyle": "Original London Driver Training Atlas POC",
      "exportedAt": "2026-06-24",
      "dataVersions": {
        "osOpenZoomstack": "record downloaded release",
        "osOpenNames": "record downloaded release",
        "osmOverlay": "record export timestamp"
      }
    }
  ]
}
```

Do not leave guessed pixel dimensions or guessed projected bounds in the
manifest. They control route overlay alignment.

## 12. Align Route Points To The Atlas Page

The app overlay expects page pixel coordinates. Existing accepted route points
are in the old generated SVG pixel space and must not be reused blindly.

Alignment options:

1. Convert accepted route source geometry from WGS84 or OS grid into atlas page
   pixels using `lib/map/atlasCoordinateTransform.ts`.
2. Redraw and review the accepted route manually in an admin tool that uses the
   new page.
3. Use the OSM route graph source geometry, transform it to atlas page pixels,
   then manually inspect it.

For projected bounds:

```txt
pageX = ((x - minX) / (maxX - minX)) * pixelWidth
pageY = ((maxY - y) / (maxY - minY)) * pixelHeight
```

For WGS84 bounds:

```txt
pageX = ((lng - west) / (east - west)) * pixelWidth
pageY = ((north - lat) / (north - south)) * pixelHeight
```

After alignment, update one route question:

```ts
{
  id: "kings-cross-to-euston",
  mapPageId: "kings-cross-euston-atlas",
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 2400,
    maxY: 1600
  },
  acceptedRoute: {
    geometry: [[/* atlas page x */, /* atlas page y */]],
    source: "manual",
    coordinateSystem: "map",
    reviewed: true
  }
}
```

Keep all other route questions on the generated SVG fallback until each route is
aligned and reviewed.

## 13. Atlas-Style Page Export Later

After the single-page POC works:

1. Create a QGIS coverage grid layer with one polygon per atlas page.
2. Add fields:

```txt
page_id
title
south
west
north
east
min_x
min_y
max_x
max_y
pixel_width
pixel_height
```

3. Enable `Generate an atlas` in the QGIS Layout Atlas panel.
4. Set the coverage layer to the grid.
5. Set the map item to be controlled by atlas.
6. Use `page_id` as the output filename expression.
7. Export atlas pages as PNG.
8. Generate or update `manifest.json` from the coverage layer metadata.

Do not automate this until the single-page style and alignment have been
accepted.

## Verification

After app metadata changes:

```txt
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Manual visual QA after a real export:

- map image loads from `/maps/atlas-pages/...`
- no network map tiles are requested
- start and end markers align to roads
- drawn route follows pointer position accurately at full view and zoomed view
- accepted route overlay aligns to visible roads
- route scoring metres are plausible for the page scale
- attribution is visible
- page style reads as original TopoPass training atlas, not A-Z
