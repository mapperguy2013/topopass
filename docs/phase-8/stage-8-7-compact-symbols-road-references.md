# Stage 8.7: Compact Original Symbols And Road References

## Status

Complete. The production `/practice/real-london` renderer was inspected at
1440 by 900 and 390 by 844 across the required fixture, zoom, learner-route,
restriction and review states. Stage 8.8 was not started.

## Scope And Originality

Stage 8.7 adds source-backed station, hospital, religious, education, civic,
museum, market, named parking, pier and landmark candidates. Every accepted
candidate retains a stable source-derived ID, category, source element type and
ID, cloned tags, source point and source geometry. Stations support named
`railway=station` and `public_transport=station` records. Piers require named
`man_made=pier` geometry, and parking requires an explicit source name.

The symbol family is original canvas linework built from typed TopoPass tokens:
compact station/rail squares, hospital crosses, religious diamonds, education
books, civic and museum linework, market canopies, a parking letterform, pier
lines and a small generic landmark triangle. The approved visual master guided
scale, hierarchy and restraint only. No symbol artwork, proprietary logo or
geography was copied from it.

## Placement And Hierarchy

Symbol size, fill, outline, detail colour, stroke, priority, zoom gate,
collision padding, same-category spacing and per-category budget are centrally
typed. Desktop admits at most 20 symbol candidates and mobile 10, with tighter
per-category caps. Base sizes are 4.8 to 6.4 canvas pixels and semantic scaling
is capped at 1.12.

Placement is deterministic and source-coordinate anchored. Symbol filtering
reserves learner markers, routes, restrictions, road names, road references and
district labels. Accepted symbols then reserve space from their coordinated
context labels; a labelled feature's text is offset beside its own symbol.
Viewport padding rejects clipped edge symbols and labels. Learner and review
overlays retain their existing draw-order dominance.

## Road References

A/B references are validated against source highway and `ref` tags. Multiple
supported refs on one road receive deterministic source-geometry positions.
Longer source segments win ties, split-way repetition retains a 360-pixel
spacing rule, and labels remain upright, red and aligned to yellow corridors.

Reference budgets are three at low zoom, six at principal zoom, seven at high
zoom and eight at very high zoom. Principal zoom also caps A-road references at
five and B-road references at three. These limits strengthen real references
without turning repeated source splits into visual noise.

## Source Coverage

The audit reports the following prepared candidates. Counts are source-backed
candidates before viewport collision and budget filtering.

| Fixture | Supported compact-symbol candidates |
| --- | --- |
| King's Cross/Euston | station 11, hospital 9, religious 28, education 19, civic 4, museum 30, parking 5, landmark 96 |
| One-way system | station 4, hospital 15, religious 7, education 8, civic 2, museum 8, landmark 4 |
| Piccadilly Circus | station 2, religious 8, education 1, civic 1, landmark 8 |
| Quiet residential | religious 4, education 4 |
| Waterloo Bridge | station 3, pier 2, religious 10, education 3, museum 6, landmark 9 |
| Real London pilot | none |

Waterloo is the only gate-ready fixture with named supported piers. No reliable
ferry-terminal candidate is present in the retained fixtures, so none is
invented. Named parking is sparse. The Central London stress fixture remains
outside normal learner rendering and is not used to inflate category coverage.

## Visual Evidence

All captures use the production learner route and displayed zoom indicator.

| Scenario | Viewport | Zoom/state | Screenshot |
| --- | --- | --- | --- |
| Piccadilly dense junction | 1440 by 900 | 100%, idle | `screenshots/stage-8-7/desktop-piccadilly-principal.png` |
| King's Cross station/public context | 1440 by 900 | 100%, idle | `screenshots/stage-8-7/desktop-kings-cross-principal.png` |
| Waterloo bridge, water and piers | 1440 by 900 | 100%, idle | `screenshots/stage-8-7/desktop-waterloo-principal.png` |
| One-way and restriction context | 1440 by 900 | 100%, idle | `screenshots/stage-8-7/desktop-one-way-restrictions.png` |
| Quiet residential context | 1440 by 900 | 100%, idle | `screenshots/stage-8-7/desktop-quiet-residential.png` |
| King's Cross overview | 1440 by 900 | 80%, idle | `screenshots/stage-8-7/desktop-kings-cross-lower-zoom.png` |
| King's Cross closer context | 1440 by 900 | 125%, idle | `screenshots/stage-8-7/desktop-kings-cross-higher-zoom.png` |
| Active learner route | 1440 by 900 | 100%, active | `screenshots/stage-8-7/desktop-active-learner-route.png` |
| Correct submitted review | 1440 by 900 | 100%, pass | `screenshots/stage-8-7/desktop-correct-review.png` |
| Incorrect submitted review | 1440 by 900 | 100%, needs review | `screenshots/stage-8-7/desktop-incorrect-review.png` |
| King's Cross station/public context | 390 by 844 | 100%, idle | `screenshots/stage-8-7/mobile-kings-cross-principal.png` |
| Waterloo bridge, water and piers | 390 by 844 | 100%, idle | `screenshots/stage-8-7/mobile-waterloo-principal.png` |
| One-way and restriction context | 390 by 844 | 100%, idle | `screenshots/stage-8-7/mobile-one-way-restrictions.png` |
| Active learner route | 390 by 844 | 100%, active | `screenshots/stage-8-7/mobile-active-learner-route.png` |
| Correct submitted details | 390 by 844 | 100%, pass | `screenshots/stage-8-7/mobile-correct-review.png` |
| Incorrect submitted details | 390 by 844 | 100%, needs review | `screenshots/stage-8-7/mobile-incorrect-review.png` |

Inspection confirmed that marks remain subordinate to route and review
overlays; genuine references are readable and geometry-attached; symbols and
labels remain aligned through pan, zoom and reset; edge clipping is suppressed;
attribution remains visible; and mobile budgets avoid an icon cloud. Lower zoom
thins detail, principal zoom provides useful context, and higher zoom remains
bounded rather than scaling symbols aggressively.

## Validation

- Focused Stage 8.7 tests: 113 passed, 0 failed.
- Phase 8 geographic/render-data audit: completed for seven real fixtures.
- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: 1,213 passed, 0 failed, 0 skipped.
- `npm.cmd test`: all eight required sub-suites passed with no failed command.
- `npm.cmd run build`: passed; 70 static pages generated.
- `git diff --check`: passed.

Visual QA produced no renderer exception. The local browser logged expected
`404` responses from the unavailable development Supabase `route_attempts`
stub when submitted attempts tried to persist; scoring, review rendering and
cartography continued normally.

## Deliberate Non-Changes

Stage 8.7 does not change route generation, validation, legality, matching,
snapping, scoring, exercises, hints, feedback, progress, authentication,
payments, deployment, coordinate transforms, route drawing, pan/zoom/reset,
restriction semantics or learner/review overlay logic. Existing building,
land-use, park, water and road geometry remain unchanged. Stage 8.4's separate
manual acceptance status is unchanged. Stage 8.8 was not started.

## Commit

Commit message: `Add Phase 8 compact symbols and refine road references`.
The resulting hash is reported in the final implementation report because a
commit cannot contain its own hash.
