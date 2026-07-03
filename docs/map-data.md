# TopoPass Map Data

TopoPass route drawing currently uses a local OpenStreetMap-derived GeoJSON
export rendered into a fixed SVG training map. The route drawing pages do not
fetch online map tiles or call live map APIs at runtime.

## Source

- Raw source: `public/maps/kings-cross-euston/osm-raw.geojson`
- Generated SVG: `public/maps/kings-cross-euston/map.svg`
- Renderer: `scripts/maps/render-kings-cross-euston-map.mjs`
- Projection/config: `src/data/maps/kings-cross-euston/map-config.json`
- Attribution: OpenStreetMap contributors, ODbL

## Curated Real London OSM Enrichment

Stage 160.5 adds a controlled dev/test enrichment path for Phase 6 visual QA:

- Script: `scripts/maps/enrich-curated-london-osm.ts`
- Command: `npm.cmd run map:enrich:curated-london-osm`
- Default source cache: `public/maps/kings-cross-euston/osm-raw.geojson`
- Default fixture output:
  `lib/map-engine/osm/fixtures/curatedLondonStage1605Overpass.json`
- Zone definitions and audit helpers:
  `app/dev/route-runner/curatedLondonOsmEnrichment.ts`

The script reads a local OSM-derived GeoJSON cache and writes deterministic
Overpass-like fixture JSON for small named London fixture zones. It does not
call Overpass or any other live map API at runtime, and the learner app does
not depend on a public OSM service. The output includes TOPOPASS provenance
metadata, source path, source timestamp where available, OSM attribution,
curated zone definitions, the tag whitelist, and the per-zone feature cap used
for the pull.

The current curated zones cover dense central streets, major roads with side
streets, high streets, a residential-estate proxy inside the local cache, park
edges, rail/station-heavy areas, awkward junctions, one-way-heavy streets,
learner route-review context, mobile viewport stress, and a small Thames bridge
zone for future wider source extracts. The zones are intentionally bounded and
small; this stage does not import all London.

Supported enriched render categories are:

- `majorRoad`
- `secondaryRoad`
- `localRoad`
- `serviceRoad`
- `nonDrivingPath`
- `bridgeRoad`
- `tunnelRoad`
- `oneWaySegment`
- `restrictedTurn`
- `park`
- `water`
- `rail`
- `station`
- `landmark`
- `areaLabel`
- `learnerOverlay`

Styling is not stored in the raw fixture. The script preserves whitelisted OSM
tags so the existing renderer and TOPOPASS cartography tokens can classify
roads, context, one-way streets, restrictions, parks, water, rail, stations,
landmarks, and area labels without hard-coding visual decisions into import
data.

Known gaps in the current Stage 160.5 generated fixture:

- The local source cache has no turn-restriction relations in the generated
  curated output, so `restrictedTurn` currently audits to zero.
- Crossings and traffic-signal nodes are not present in the generated output.
- The Thames bridge zone is defined for future controlled extracts, but the
  current local cache is central/north-central and does not cover the Thames.
- OSM access, maxspeed, lane, landmark, and public-building tags vary by area
  and can be incomplete.

A future broader import should use an offline Geofabrik extract or another
cached OSM-derived source through the same bounded-zone and whitelist approach,
rather than making the live app call Overpass.

## Manual Curated Overpass Fixtures

Stage 160.5 also ingests four manually exported Overpass JSON files for
Phase 6 visual QA and street-atlas refinement. These are committed fixtures,
not live runtime API calls, and they do not replace
`realLondonPilotOverpass.json`.

| Fixture | Purpose | OSM base timestamp |
| --- | --- | --- |
| `realLondonPilotOverpass.json` | Existing Real London pilot fixture for beta route QA | Existing committed pilot export |
| `piccadillyCircusOverpass.json` | Dense Central London and complex street readability | `2026-07-03T00:09:45Z` |
| `waterlooBridgeOverpass.json` | Thames, bridge, rail/station, and central context | `2026-07-03T00:11:45Z` |
| `oneWaySystemAreaOverpass.json` | One-way and restriction cartography | `2026-07-03T00:13:44Z` |
| `quietResidentialRoadsOverpass.json` | Suburban learner-driver readability | `2026-07-03T00:14:43Z` |

The four new fixtures are registered as dev-only route-runner map options and
visual QA scenarios. They are useful for testing road hierarchy, labels,
parks/water/rail/station context, one-way/restriction cartography, learner
overlays, and mobile readability. They are not full London coverage and are not
part of a production map-provider dependency.

Coverage summary:

| Fixture | Nodes | Ways | Relations | Named roads | One-way ways | Turn restrictions | Parks/open space | Water | Rail | Stations | Landmark/amenity/place candidates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `piccadillyCircusOverpass.json` | 3,855 | 1,401 | 13 | 418 | 204 | 12 | 3 | 2 | 9 | 3 | 29 |
| `waterlooBridgeOverpass.json` | 14,286 | 3,037 | 44 | 784 | 455 | 41 | 62 | 14 | 89 | 3 | 36 |
| `oneWaySystemAreaOverpass.json` | 9,635 | 3,719 | 50 | 1,104 | 632 | 50 | 49 | 2 | 24 | 4 | 46 |
| `quietResidentialRoadsOverpass.json` | 2,859 | 468 | 12 | 177 | 35 | 12 | 19 | 4 | 0 | 0 | 8 |

The renderer-facing categories remain derived from OSM tags at conversion or
visual-model time: `majorRoad`, `secondaryRoad`, `localRoad`, `serviceRoad`,
`nonDrivingPath`, `bridgeRoad`, `tunnelRoad`, `oneWaySegment`,
`restrictedTurn`, `park`, `water`, `rail`, `station`, `landmark`, and
`areaLabel`. Raw fixture data does not contain TOPOPASS styling decisions.

Attribution requirement: these fixtures are OpenStreetMap-derived data made
available under ODbL, so OSM attribution must stay visible wherever they are
shown. No A-Z, Google, Apple, Ordnance Survey, proprietary tiles, screenshots,
icons, palettes, or copied map artwork are used.

## Actual GeoJSON Coverage

The current raw GeoJSON contains:

- Total features: `20,390`
- Coordinate bounding box:
  - west: `-0.1762291`
  - south: `51.5080115`
  - east: `-0.0574862`
  - north: `51.5524761`
- Approximate extent: `8.22 km` wide by `4.92 km` high

This appears to cover a central/north-central London training extract rather
than all London. It includes King's Cross, Euston, Bloomsbury, Clerkenwell and
nearby central/east-central context. It is not a full Greater London dataset.

## Highway Types Present

The current source includes these OSM `highway` values:

- `construction`: 6
- `corridor`: 19
- `cycleway`: 523
- `footway`: 7,014
- `path`: 63
- `pedestrian`: 207
- `platform`: 14
- `primary`: 674
- `primary_link`: 18
- `proposed`: 39
- `residential`: 624
- `secondary`: 137
- `secondary_link`: 3
- `service`: 1,062
- `steps`: 329
- `tertiary`: 251
- `track`: 3
- `trunk`: 338
- `trunk_link`: 24
- `unclassified`: 666

Road naming and driver tags:

- Named roads: `3,815`
- Named minor roads: `2,361`
- Roads with `oneway`: `2,099`
- Roads with access-related tags: `874`
- Roads with restriction-relevant tags such as `oneway`, `access`, `vehicle`,
  `motor_vehicle`, `motorcar`, `service`, `junction`, or `barrier`: `2,837`

## Rendered Training Area

The current map config renders a fixed `1600 x 1000` SVG using these map bounds:

- west: `-0.15`
- south: `51.516`
- east: `-0.1`
- north: `51.536`

The renderer expands those bounds by `0.006` degrees for surrounding context.
It filters features by the active bounds plus buffer before creating drawing
datasets. The current Overpass export appears to contain ways that intersect
the active training area, so the present render still keeps all source
features. If a wider/all-London GeoJSON is supplied later, the same filtering
step will exclude far-away features before rendering.

## A-Z-Style Rendering Goals

The generated map intentionally avoids Google/Apple/Mapbox/OSM default tile
styling. It uses:

- Pale paper/off-white background
- Dense street network
- Strong yellow/orange main driver roads
- White/pale local roads with grey casing
- Compact dark road labels
- Muted parks, water, rail, buildings and station areas
- Flat printed-map appearance

## Road Hierarchy

The renderer styles roads by OSM `highway` hierarchy:

- `motorway`, `trunk`, `primary`: strongest yellow/orange, thickest casing/fill
- `secondary`: strong yellow/orange but less dominant
- `tertiary`: lighter yellow/orange
- `residential`, `unclassified`, `living_street`: white/pale local roads
- `service`, `track`: subdued service-road styling unless private/service-only
- `pedestrian`, `footway`, `path`, `cycleway`, `steps`: subtle dashed non-driving
  style

All named publicly drivable roads are considered for labels, including minor and
local roads. Labels are deduplicated and collision-filtered so the map remains
readable. In the current generated SVG there are `260` road labels, including
`217` local/service/minor road labels.

## Driver Access Classification

Driver access logic is implemented in:

- `lib/map/osmRoadAccess.ts`
- `scripts/maps/road-access.mjs`

Classification output:

- `drive_both_ways`
- `drive_one_way_forward`
- `drive_one_way_reverse`
- `no_motor_vehicle`
- `pedestrian_only`
- `service_or_private`
- `unknown`

Rules:

- `highway=footway/path/cycleway/steps` => `pedestrian_only`
- `highway=pedestrian` => `pedestrian_only` unless `motor_vehicle` or
  `motorcar` explicitly allows vehicles
- `access=no`, `vehicle=no`, `motor_vehicle=no`, or `motorcar=no` =>
  `no_motor_vehicle`
- `access=private`, `vehicle=private`, `motor_vehicle=private`, or
  `motorcar=private` => `service_or_private`
- `highway=service` with `service=driveway/parking_aisle/alley` =>
  `service_or_private`
- `oneway=yes/1/true` => `drive_one_way_forward`
- `oneway=-1` => `drive_one_way_reverse`
- `junction=roundabout` => `drive_one_way_forward`
- Recognised public drivable road with no restriction tag => `drive_both_ways`
- Missing or ambiguous highway/access data => `unknown`

Unknown roads are neutral. They are not shown as restricted unless OSM tags
support a real restriction.

## One-Way and Restriction Overlays

The generated SVG includes:

- Subtle one-way arrows along one-way roads
- Reverse arrows for `oneway=-1`
- Dashed no-motor styling and small bar marks where tags indicate no motor
  vehicle access
- Subdued styling for service/private roads
- Light dashed styling for pedestrian-only paths
- Neutral subdued styling for unknown roads

The current generated SVG contains:

- One-way arrows: `170`
- Restriction bars: `20`
- Road paths carrying preserved `data-highway` attributes: `15,152`

## Preserved Tags

Rendered road paths preserve useful source tags as SVG `data-*` attributes:

- `name`
- `highway`
- `access-class`
- `oneway`
- `access`
- `vehicle`
- `motor-vehicle`
- `motorcar`
- `service`
- `junction`
- `barrier`

This keeps the generated map inspectable without pretending the SVG is the raw
data source.

## Updating the Map

To update the visible map after changing `osm-raw.geojson`, renderer logic, or
map config:

```powershell
npm.cmd run map:render:kings-cross-euston
```

Only regenerate the route graph when route geometry generation has changed:

```powershell
npm.cmd run map:graph:kings-cross-euston
```

Full map rebuild:

```powershell
npm.cmd run map:build:kings-cross-euston
```

## Limitations

- This is not a copy of the commercial London A-Z atlas.
- The style is an original training style inspired by printed street-atlas
  readability.
- OSM access data can be incomplete or imperfect.
- Unknown access is intentionally neutral.
- Route scoring is still prototype-level and needs calibration against reviewed
  routes and real learner attempts.
- The current map extract is central/north-central London, not all London.
