# Stage 8.5: Atlas Label Density And Place-Name Pass

## Status

Complete for Stage 8.5. Implemented in the production Real London canvas
renderer, visually accepted against the Phase 8 visual master for label
density and place-name character, and validated with the full required local
suite. A focused Stage 8.5 visual-QA correction later tightened the displayed
100% exam baseline, label edge filtering, one-way arrow dominance, and A/B
reference emphasis without starting Stage 8.6.

## Goal And Educational Purpose

Stage 8.5 makes learners scan a denser London atlas by presenting many real
street names, large district names, major-road references, and useful named
places without adding route guidance. The labels support independent street,
district, and landmark recognition while learner routes and assessment feedback
remain the highest visual layer.

## Visual Reference

The controlling reference is
`references/phase-8-approved-exam-atlas-visual-master.png`. It informed compact
condensed typography, large place-name hierarchy, frequent street names, and
red road references on yellow corridors. No geography, exact placement,
proprietary font, artwork, or reference-image text was copied.

## Supported Categories And Source Rules

- Major and local road names come from named map roads converted from committed
  OSM ways. Several deterministic source-segment candidates may represent a
  long road so labels remain available while panning and zooming.
- A/B references come only from Stage 8.3 `road-reference` features whose source
  has both a supported `highway` tag and a valid `ref` value.
- Districts and neighbourhoods come from supported OSM `place` features.
- Parks, water, stations, institutions, named residential estates, commercial
  land use, bridges, and selected public landmarks come from their normalised
  Real London context features.
- Unnamed and unsupported features are rejected. The approved visual master is
  never used as a data source.
- Every generated candidate carries a source feature ID. OSM candidates also
  retain element type, element ID, and cloned source tags.

## Hierarchy, Collision, And Zoom Policy

Layout priority is learner reservations, road references, districts, major
roads, stations and landmarks, local roads, then contextual land-use labels.
The base-label filter consumes existing learner route and marker reservation
boxes, requires label boxes to fit within a padded viewport, and uses
deterministic ID tie breaks. Edge-crossing labels are suppressed rather than
drawn visibly clipped.

Road references use a bounded per-viewport budget and repeat distance so red
references remain prominent without replacing the street-name field. Road-name
repeats are distance-throttled, collision boxes follow road angle, and only
labels that fit useful road geometry are accepted. Lower zoom suppresses minor
labels; principal exam zoom remains dense; higher zoom reveals service and
shorter-road labels. Canvas letter spacing is explicitly zero.

The displayed 100% exam view maps to the closer visual scale previously reached
only by zooming in manually. The UI still reports 100% at reset/default, and
route drawing, pan, zoom, marker placement, and coordinate conversion continue
to use the shared viewport transform.

## Fixture Coverage

Before viewport filtering, the normal non-lazy Real London fixtures currently
produce:

| Fixture | Candidates | Road refs | Major road | Local road | District | Place/context |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Piccadilly Circus | 939 | 67 | 349 | 494 | 1 | 28 |
| Waterloo Bridge | 1,945 | 196 | 662 | 1,029 | 5 | 53 |
| One-way system | 2,323 | 268 | 753 | 1,221 | 3 | 78 |
| Quiet residential roads | 1,007 | 39 | 237 | 711 | 0 | 20 |

At the 1920 by 912 default desktop fit, collision filtering currently leaves
22 to 30 visible road names per fixture, up from the previous minimum checks of
8 to 10, plus up to four road references and supported context labels.

## Automated Tests

Focused tests cover category extraction, OSM metadata preservation, unsupported
and unnamed rejection, deterministic output, category counts, red reference
style, reference repetition limits, district and road hierarchy, viewport
clipping, zoom gates, collision priority, learner reservation precedence, and
stable fixture density. Existing map, restriction, overlay, coordinate, and
route tests remain in the required validation set.

Required validation after final Stage 8.5 fixes:

- `npm.cmd run lint`
- `npm.cmd run test:map`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

## Visual QA Evidence

The local app was started with `npm.cmd run dev` at `http://localhost:3000`.
The integrated browser backend was unavailable, so visual QA used installed
headless Chrome through the Chrome DevTools Protocol against the local server.

Screenshots are committed under `screenshots/stage-8-5/`:

| Scenario | Viewport | Screenshot |
| --- | --- | --- |
| Dense central junction, street labels, and A/B references | 1440 by 900 | `desktop-piccadilly-dense-junction.png` |
| Major A/B corridor, river context, and place labels | 1440 by 900 | `desktop-waterloo-major-corridor.png` |
| One-way and restriction context with checkpoint marker | 1440 by 900 | `desktop-one-way-restrictions.png` |
| Active learner route over Stage 8.5 labels | 1440 by 900 | `desktop-active-learner-route.png` |
| Correct submitted review overlay | 1440 by 900 | `desktop-correct-review.png` |
| Incorrect submitted review overlay | 1440 by 900 | `desktop-incorrect-review.png` |
| Dense central junction on mobile | 390 by 844 | `mobile-piccadilly-dense-junction.png` |
| Quiet residential streets on mobile | 390 by 844 | `mobile-quiet-residential.png` |
| Major A/B corridor on mobile | 390 by 844 | `mobile-waterloo-major-corridor.png` |
| One-way and restriction context on mobile | 390 by 844 | `mobile-one-way-restrictions.png` |

Accepted visual findings:

- Stage 8.5 is visibly denser than Stage 8.4's road-base hand-off because
  many more source-backed local street names, district/place labels, and red
  A/B references are present.
- The screenshots move toward the approved visual master's compact street-name
  field, large place hierarchy, and red references on yellow corridors without
  copying its geography, exact placement, artwork, or typography.
- Learner route traces, start/destination/checkpoint markers, restriction
  symbols, pass/fail review overlays, map controls, and OSM attribution remain
  visible above the denser label field.
- Mobile 390 by 844 screenshots remain readable: labels are not clipped,
  route markers stay aligned, attribution remains visible, and the four-road
  reference budget does not overwhelm the view.

Focused correction screenshots are committed under
`screenshots/stage-8-5-correction/`:

| Scenario | Viewport | Screenshot |
| --- | --- | --- |
| Dense central labels and A/B references at displayed 100% | 1440 by 900 | `desktop-piccadilly-100.png` |
| One-way/restriction context at displayed 100% | 1440 by 900 | `desktop-one-way-100.png` |
| Dense central labels and A/B references at displayed 100% | 390 by 844 | `mobile-piccadilly-100.png` |
| One-way/restriction context at displayed 100% | 390 by 844 | `mobile-one-way-100.png` |

Correction findings:

- Displayed 100% now opens at the useful closer exam scale while retaining the
  100% UI indicator.
- Red A/B references are stronger at principal exam zoom but remain capped by
  the four-reference viewport budget and a larger repeat distance.
- Repeated blue one-way arrows are more subordinate to street labels and no
  longer dominate dense one-way areas.
- Labels that would cross the map edge are rejected, so rendered street and
  context labels are not visibly clipped in the corrected desktop/mobile views.

## Non-Goals And Known Limitations

This stage does not change route generation, matching, snapping, legality,
scoring, hints, progress, review overlays, roads, junctions, buildings,
authentication, or deployment. It adds no turn-by-turn guidance and no new data
provider.

Named estates and other land-use labels remain absent in several committed
fixtures because the source polygons have no supported names. District coverage
is fixture-dependent, and the quiet-residential fixture currently has no
supported district feature. Collision boxes use deterministic estimated text
widths rather than browser font metrics.

The larger Central London stress fixture remains dev-only/lazy and did not
complete within the temporary headless QA capture helper, so dense central
evidence uses the beta-available Piccadilly Circus and Waterloo Bridge
fixtures. This stage still does not implement the visual master's dense
building fabric, institutional area fills, pier symbols, or full land-use field
treatment; those remain future Phase 8 work.

## Commit Message

`Improve Phase 8 atlas label density`
