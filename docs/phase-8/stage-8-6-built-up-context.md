# Stage 8.6: Buildings, Built-up Fabric, Institutions, Parks And Water

## Status

Complete for Stage 8.6. The production Real London canvas renderer consumes the
typed Stage 8.3 area geometry, applies original TOPOPASS atlas styling and
bounded semantic-zoom rules, preserves source traceability, and has been
inspected at desktop and mobile sizes against the Phase 8 visual master for
cartographic character only.

## Goal And Educational Purpose

Stage 8.6 adds the built and open-space fabric needed to read London as an
examination atlas rather than a road diagram. Buildings, institutional grounds,
land use, parks and water provide orientation without becoming route guidance.
Roads, names, restrictions, learner routes, markers and review feedback remain
more prominent and aligned through the shared map viewport transform.

## Visual Reference And Originality

The controlling appearance reference is
`references/phase-8-approved-exam-atlas-visual-master.png`. It informed the
relationship between warm land, cream/tan building footprints, muted pink
institutional areas, quiet land-use fields, green parks and pale-blue water.
No geography, artwork, exact colours, symbols, labels or placements were copied.
All rendered geometry comes from committed, attributed source data.

## Supported Geometry And Source Rules

- Buildings support residential, commercial, retail, industrial, public,
  civic, hospital, transport and generic subtypes.
- Institutions support education, healthcare, civic and religious subtypes.
- Land use supports residential, commercial/retail, industrial and rail
  subtypes.
- Parks/open space and water use their existing typed context categories.
- Closed OSM ways and complete multipolygon relation rings are accepted.
  Relation inner rings are associated with their containing outer ring and are
  drawn with even-odd fill so courtyards and water/land holes remain open.
- Open, non-finite, degenerate and below-threshold polygons are skipped safely.
- Every prepared area retains its source feature ID, element type, element ID
  and cloned source tags. The approved visual master is never a data source.

## Draw Order And Style Policy

The deterministic background order is land-use, parks/water, institutional
areas, building footprints and pedestrian areas. Rail, bridges and waterways
then render above area fills, followed by roads, labels, restrictions, learner
routes, markers and review overlays. Larger polygons draw before smaller
polygons within a layer, with stable feature IDs resolving ties.

Typed style tokens centralise fill, outline, alpha, minimum scale, minimum
rendered area, simplification tolerance and maximum stroke width. Low scale
suppresses small footprints and simplifies remaining rings; principal exam zoom
reveals useful fabric; higher zoom increases detail through capped alpha and
stroke changes. This avoids stretched or increasingly opaque polygons.

Waterway centre lines were reduced after screenshot inspection so the filled
Thames remains context rather than competing with bridge roads and street
labels. Building and institution outlines stay crisp but subordinate to the
yellow major-road corridors and dark local-road network.

## Fixture Coverage

The normal beta gate renders 38 building polygons and 44 institutional
polygons across Piccadilly Circus, Waterloo Bridge, the one-way system and
quiet-residential fixtures. It renders no land-use polygons because those
committed gate-ready fixtures do not contain supported retained land-use
geometry. The safely hydrated King's Cross / Euston fixture supplies the
strongest dense evidence and brings the audit totals to 97 buildings, 101
institutional polygons and 128 land-use polygons. The Central London source
fixture remains dev-only and is not hydrated by normal learner paths.

Coverage is intentionally source-dependent. Sparse Piccadilly and residential
fixtures remain sparse; the renderer does not invent blocks to imitate the
visual master.

## Automated Coverage

Tests cover all supported building, institution and land-use subtypes;
deterministic layer order; metadata preservation; courtyard inner rings;
invalid, open and degenerate rejection; viewport clipping; semantic-zoom gates;
bounded alpha and strokes; fixture counts; input immutability; and the
production order below roads, labels, restrictions and learner overlays.

Required final validation is:

- `npm.cmd run lint`
- `npm.cmd run test:map`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

## Visual QA Evidence

The app was run with the documented `npm.cmd run dev` command. The integrated
browser backend exposed no browser instance, so installed headless Chrome was
driven through the Chrome DevTools Protocol against the local server. All
screenshots show the production renderer at displayed 100%.

Screenshots are committed under `screenshots/stage-8-6/`:

| Scenario and fixture | Viewport | State | Screenshot |
| --- | --- | --- | --- |
| Piccadilly dense junction and built context | 1440 by 900 | Unstarted | `desktop-piccadilly-built-context.png` |
| King's Cross / Euston dense fabric, institutions, parks and land use | 1440 by 900 | Unstarted, lazy fixture loaded | `desktop-kings-cross-built-institutional.png` |
| Waterloo river, bridge and major-road hierarchy | 1440 by 900 | Unstarted | `desktop-waterloo-water-bridge.png` |
| Quiet residential source coverage | 1440 by 900 | Unstarted | `desktop-quiet-residential-context.png` |
| Learner route above context fabric | 1440 by 900 | Active attempt | `desktop-active-route-context.png` |
| Dense context under accepted review | 1440 by 900 | Correct, submitted | `desktop-correct-review-context.png` |
| Built context under failed review | 1440 by 900 | Incorrect, submitted | `desktop-incorrect-review-context.png` |
| Piccadilly built context | 390 by 844 | Unstarted | `mobile-piccadilly-built-context.png` |
| Quiet residential park context | 390 by 844 | Unstarted | `mobile-quiet-residential-park-context.png` |
| Waterloo river and bridge | 390 by 844 | Unstarted | `mobile-waterloo-water-bridge.png` |
| One-way context with learner route | 390 by 844 | Active attempt | `mobile-one-way-active-context.png` |

Visual comparison found the King's Cross view materially closer to the master:
the previously empty land field now carries dense cream footprints, pink
institutions, green open space, quiet land-use blocks and pale water while the
major-road and street-label hierarchy remains dominant. Piccadilly, Waterloo
and quiet-residential views add only what their fixtures support. Desktop pan
and wheel zoom, mobile pinch, reset to displayed 100%, route drawing, marker and
checkpoint alignment, restrictions, correct/incorrect review overlays,
attribution and responsive canvas alignment were exercised against rendered
state.

## Deliberate Non-Changes And Limitations

Stage 8.6 does not add Stage 8.7 compact symbols or road-reference refinements.
It does not change routing, legality, matching, snapping, scoring, exercise
selection, labels, road hierarchy, restrictions, learner overlays,
authentication, payments or deployment. No unsourced decorative geometry or
synthetic production geography was added.

Multipolygon support requires complete rings and associates a hole by a point
inside an outer ring; nested islands and malformed relation topology are not
repaired. Geometry simplification is screen-space and intentionally
conservative rather than a full topology-preserving polygon simplifier.
Coverage remains uneven because the committed fixtures are uneven. The Central
London stress fixture still needs a later performance strategy before its full
fabric can be enabled. Pier symbols remain outside this stage. The existing
mobile toolbar is tight at 390 pixels and can clip its final text control; that
is existing UI work reserved for the later mobile/accessibility stage, not an
area-rendering defect.

## Commit Message

`Render Phase 8 atlas context fabric`
