# Cleanroom Driver Training Atlas Asset

This asset is a generated review artifact only. It is not wired into the
TopoPass app UI and does not replace the current route-practice map.

## Command

```powershell
npm.cmd run map:render:driver-training-atlas
```

## Inputs

- `public/maps/kings-cross-euston/osm-raw.geojson`
- `src/data/maps/kings-cross-euston/map-config.json`

No extra open data is used by this generator.

## Outputs

- `public/maps/generated/kings-cross-euston-driver-training-atlas.svg`
- `public/maps/generated/kings-cross-euston-driver-training-atlas.png`
- `public/maps/generated/kings-cross-euston-driver-training-atlas.report.json`

The PNG is exported from the generated SVG with local headless Chrome when
available.

## Cleanroom Style Notes

- The map uses an original TopoPass "London Driver Training Atlas" style.
- Example images were used only as high-level visual direction: dense road
  labels, stronger hierarchy, printed-page feel, clear one-way arrows, and clear
  no-entry indicators.
- No A-Z artwork, screenshots, typography files, symbols, or traced geometry are
  used.
- Road geometry, names, refs, one-way data, access restrictions, stations,
  buildings, parks, water, and rail context come from the local OSM GeoJSON.

## Styling Logic

- A roads: OSM `ref` values starting with `A` and trunk/primary roads render
  with thick dark casing, orange fill, large road labels, and route shields.
- B roads: OSM `ref` values starting with `B` and secondary roads render with
  strong yellow fill and route shields.
- Minor roads: residential, unclassified, service, and other local roads remain
  visible and are labelled where source names and collision rules allow.
- One-way streets: source one-way and roundabout logic from
  `scripts/maps/road-access.mjs` renders long light-pink directional arrows.
- No-entry/restricted roads: explicit `access=no`, `vehicle=no`,
  `motor_vehicle=no`, or `motorcar=no` style restrictions render as thick red
  overlays with barred no-entry markers.

## Limitations

- The generator only marks restrictions that are explicit in the source data.
- Label placement is deterministic collision avoidance, not cartographer-edited
  placement.
- The asset is for visual review before any app integration decision.
