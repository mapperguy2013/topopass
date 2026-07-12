# Stage 8.3: Atlas Render-Data Adapter

## Goal And Educational Purpose

Stage 8.3 expands the committed OpenStreetMap-derived Real London context
adapter so later renderer stages can build a dense examination-atlas hierarchy.
The data supports rapid road-following, landmark recognition, and orientation
practice while leaving current route generation, scoring, attempts,
persistence, and learner gameplay unchanged.

## Visual Reference

The controlling appearance reference is
`references/phase-8-approved-exam-atlas-visual-master.png`. It establishes the
need for dense building fabric, distinct institutional grounds, contextual
land-use blocks, strong major-road hierarchy, and prominent red A/B road
references. It is not a geography source. Every feature produced by this stage
comes from permitted project OSM fixtures and retains source element metadata.

## Affected Systems

- Real London OSM context feature types and conversion.
- Curated OSM tag retention for institutional classification.
- Phase 8 geographic/render-data audit reporting.
- Route-runner map and adapter unit tests.
- Phase 8 status documentation.

## Changes Made

- Added normalised closed-way and multipolygon outer-ring building footprints.
- Classified building footprints as residential, commercial, retail,
  industrial, education, healthcare, civic, religious, or other.
- Added education, healthcare, civic, and religious institutional areas from
  supported OSM amenity, building, healthcare, land-use, office, and government
  tags.
- Added residential, commercial, retail, and industrial land-use blocks.
- Added A-road and B-road features only from valid `highway=*` plus `ref=*`
  combinations. Multiple comma/semicolon-separated refs are normalised and
  deduplicated; unrelated and non-highway refs are ignored.
- Added stable source-derived IDs, fixed category/source-ID ordering, cloned
  source tags, source element type, and source element ID on every new feature.
- Added source coverage counts for every new category and subtype.
- Added `healthcare`, `government`, `office`, and `religion` to the curated tag
  whitelist so regenerated fixtures retain classification evidence.
- Updated the Stage 8 audit to distinguish adapter-ready polygons and refs from
  the still-zero renderer consumption counts.

With normal stress/lazy gates, the real-fixture audit exposes 38 building
footprints, 44 institutional areas, and 596 road-reference features. Explicitly
hydrating the lazy King's Cross/Euston fixture raises coverage to 97 building
footprints, 101 institutional areas, 128 land-use blocks, and 1,426
road-reference features. Central London remains excluded from routine adapter
conversion by its existing dev-only stress-test gate.

## Non-Goals

- No final atlas colours, fills, road strokes, symbols, labels, collision
  handling, or road-reference placement.
- No route generation, legality, matching, snapping, scoring, attempts,
  persistence, progress, or gameplay changes.
- No new geographic provider, live fetch, fixture geography, or inferred road
  reference.
- No place/estate promotion from ambiguous residential names and no pier
  adapter.

## Visual Acceptance Criteria For Later Renderer Stages

- Building features can form dense but legible built fabric at examination
  scale without obscuring roads or route overlays.
- Education, healthcare, civic, and religious grounds remain visually
  distinguishable from general buildings and from each other where required.
- Residential, commercial, retail, and industrial blocks provide quiet area
  context below the road hierarchy.
- A/B references are rendered prominently from source `reference` values only,
  remain associated with their source road geometry, and are not inferred from
  road names.
- Existing parks, water, rail, stations, landmarks, routes, restrictions, and
  OpenStreetMap attribution remain readable.
- Dense output remains deterministic across runs and within Central London
  performance limits established before that fixture is enabled.

## Automated Tests And Manual QA

Automated coverage verifies feature conversion, deterministic ordering and
IDs, source metadata, coverage totals, all new subtypes, valid A/B refs,
multiple refs, ignored unrelated/non-highway refs, input immutability, audit
pipeline states, and existing route-runner context expectations.

Required validation commands:

```bash
npm run lint
npm run test:map
npm test
npm run build
git diff --check
```

Manual review of the approved visual master was completed for data-layer cues.
No new visual output is expected in this stage. A later browser QA pass must
confirm representative Real London maps remain visually unchanged and that
route drawing, pan/zoom, learner/review overlays, and OSM attribution still
behave normally when renderer consumption begins.

## Known Limitations

- The current renderer intentionally ignores all four new feature kinds.
- Multipolygon conversion emits complete outer rings only; inner holes are not
  represented yet.
- Building footprints are not simplified, tiled, or zoom-filtered.
- Repeated road refs along segmented roads are retained as source features;
  later placement/collision logic must choose display instances.
- Routine audits do not hydrate King's Cross/Euston and do not convert the
  Central London stress fixture unless explicitly requested.
- Land-use coverage depends on polygon tags retained in each committed fixture;
  several smaller fixtures contain no supported land-use polygons.

## Commit Message

`Add Phase 8 atlas render-data adapter`
