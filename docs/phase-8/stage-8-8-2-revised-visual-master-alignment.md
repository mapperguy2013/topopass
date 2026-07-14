# Stage 8.8.2: Revised Visual-Master Alignment

## Status

Implementation and production-renderer visual QA are complete. Final validation
results are recorded below after the required local checks. Stage 8.10 was not
started.

## Why Stage 8.8.2 Exists

Stage 8.8.1 made the Victoria / Westminster / Vauxhall benchmark substantially
denser and closer to the original Phase 8 visual master, but the approved
appearance reference has since been revised. The revised reference is:

`references/phase-8-approved-exam-atlas-visual-master-v2.png`

The v2 image is ChatGPT-generated for this project and is an appearance-only
control. It can guide density, hierarchy, colour relationships, typography
compactness and composition. It is not production geography, a raster map
layer, copied label content, copied road layout, copied symbols or a source of
hard-coded screenshot-specific data.

The original v1 reference remains at:

`references/phase-8-approved-exam-atlas-visual-master.png`

## Preflight

- Initial HEAD: `e2845ad9e7bb61aa9fa20a05f37f457d374a9b05`
  (`Correct compact learner hint presentation`).
- Initial working tree was clean except the intentional untracked uploaded v2
  reference image:
  `references/phase-8-New-approved-exam-atlas-visual-master.png`.
- The v2 reference was copied to the stable committed filename
  `references/phase-8-approved-exam-atlas-visual-master-v2.png`.
- The historical Stage 8.9 stash remained untouched:
  `stash@{0}: On main: WIP Stage 8.9 overlay rebalance before Stage 8.8.1`.
- The v1 and v2 references, committed Stage 8.8.1 / Stage 8.9 evidence and
  current displayed-100% renderer output were inspected at normal size before
  editing.

## Source Coverage Audit

The lightweight Victoria / Westminster / Vauxhall fixture already contained
enough permitted source-backed geometry for a denser atlas treatment. No source
fixture expansion was required.

| Coverage level | Before | After |
| --- | ---: | ---: |
| Raw unique elements | 63,469 | 63,469 |
| Raw nodes / ways | 47,488 / 15,954 | 47,488 / 15,954 |
| Raw named-road ways | 2,495 | 2,495 |
| Raw building ways | 5,688 | 5,688 |
| Raw contextual elements | 2,593 | 2,593 |
| Adapted road-label candidates | 6,187 | 6,187 |
| Adapted road-reference candidates | 939 | 939 |
| Adapted building polygons | 5,675 | 5,675 |
| Adapted compact-symbol candidates | 336 | 336 |

Production desktop principal canvas, displayed 100%, 1120 by 760:

| Displayed coverage | Stage 8.8.1 baseline | Stage 8.8.2 |
| --- | ---: | ---: |
| Visible building polygons | 4,094 | 4,279 |
| Displayed road labels | 85 | 106 |
| Unique displayed road names | 70 | 82 |
| Displayed road references | 6 | 7 |
| District labels | 9 | 10 |
| Institution / landmark / public-building labels | 15 / 17 / 9 | 14 / 15 / 10 |
| Compact symbols | 32 | 40 |
| Accepted labels before symbol placement | 149 | 183 |

The Stage 8.8.2 viewport is intentionally wider than Stage 8.8.1 so that
Lambeth and Kennington read with Victoria, Pimlico, Westminster, Millbank,
Vauxhall and the Thames corridor, matching the revised master's broader
context. The denser label and symbol rules offset the additional extent without
restoring the sparse Stage 8.8 look.

## Implementation

- Victoria reset/framing now keeps the principal view on Victoria, Pimlico,
  Westminster, Millbank, Vauxhall, Lambeth, Kennington and the Thames corridor
  while still excluding Covent Garden, Temple and Blackfriars from the reset
  focus.
- Major and secondary roads use stronger yellow/orange fills, darker casings
  and more legible junction geometry.
- Local, tertiary and service roads use slightly stronger strokes so dense
  side-street structure reads under compact labels.
- Road labels are more compact, darker, repeat sooner and use tighter collision
  boxes at displayed 100%.
- Genuine A/B references remain red and prominent, with a slightly larger
  viewport budget and stronger compact type.
- Building, institutional, park, water, rail and bridge styling was tightened
  toward the v2 hierarchy without adding invented geography.
- Compact source-backed symbols have smaller marks, lower principal gates and
  a higher bounded desktop budget.
- The benchmark regression now asserts the wider reset context, increased
  label density, increased symbol count, preserved A/B references, stronger
  road hierarchy and mobile/desktop density behaviour.

No label, feature, symbol, road, building or coordinate was copied from the v2
image. No Victoria-specific visible exception was added.

## Screenshot Index

All captures are production-renderer screenshots saved under
`screenshots/stage-8-8-2/`.

| Scenario | Viewport/state | Screenshot |
| --- | --- | --- |
| Victoria / Westminster / Vauxhall / Lambeth | desktop, displayed 80% | `desktop-victoria-westminster-vauxhall-lambeth-80.png` |
| Victoria / Westminster / Vauxhall / Lambeth | desktop, displayed 100% | `desktop-victoria-westminster-vauxhall-lambeth-100.png` |
| Victoria / Westminster / Vauxhall / Lambeth | desktop, displayed 125% | `desktop-victoria-westminster-vauxhall-lambeth-125.png` |
| King's Cross / Euston | desktop, displayed 100% | `desktop-kings-cross-euston-100.png` |
| Piccadilly | desktop, displayed 100% | `desktop-piccadilly-100.png` |
| Waterloo | desktop, displayed 100% | `desktop-waterloo-100.png` |
| Quiet residential | desktop, displayed 100% | `desktop-quiet-residential-100.png` |
| One-way / restrictions | desktop, displayed 100% | `desktop-one-way-restrictions-100.png` |
| Active learner route | desktop, displayed 100% | `desktop-active-learner-route-100.png` |
| Passing review | desktop, submitted review | `desktop-correct-review-100.png` |
| Incorrect review | desktop, submitted review | `desktop-incorrect-review-100.png` |
| Hint visible over map | desktop, displayed 100% | `desktop-hint-visible-100.png` |
| No-route / ready state | desktop, displayed 100% | `desktop-victoria-no-route-ready-100.png` |
| Victoria / Westminster / Vauxhall / Lambeth | mobile, displayed 100% | `mobile-victoria-westminster-vauxhall-lambeth-100.png` |
| Waterloo | mobile, displayed 100% | `mobile-waterloo-100.png` |
| Active learner route | mobile 390 by 844 | `mobile-active-learner-route-100.png` |
| Passing review | mobile 390 by 844 | `mobile-correct-review-100.png` |
| Incorrect review | mobile 390 by 844 | `mobile-incorrect-review-100.png` |
| Hint visible | mobile, displayed 100% | `mobile-hint-visible-100.png` |

## Visual Findings

Normal-size inspection found the desktop Victoria 100% capture is visibly
closer to v2 than Stage 8.8.1. The visible map field is broader, warmer and
more densely occupied. Building fabric reads continuously across dense areas,
local street labels are more numerous, red A/B references remain readable, and
the Thames / bridge / Westminster / Lambeth context is stronger.

King's Cross / Euston confirms that A501, A5200, A400, A201 and related
references remain attached to rendered road corridors. Waterloo confirms the
stronger river and bridge relationship. Piccadilly and the quiet residential
fixture remain readable where the source fixture is naturally lighter.

Learner and review overlays remain above the base map. Stage 8.8.2 did not
change overlay ownership, route drawing, scoring, hints, submission or review
logic. The mobile active-route capture verifies the narrow layout still shows
map geometry and route context; the submitted mobile review captures verify the
mobile viewport state, while desktop submitted-review screenshots remain the
primary map-overlay evidence for pass/fail alignment.

## Remaining Visual Differences

| Difference | Accounting |
| --- | --- |
| The v2 reference has generated labels, road placements and symbol density that do not correspond exactly to the real fixture. | Production output remains source-backed and does not copy or fabricate geography. |
| Some fixtures, especially Piccadilly, still have lighter building/context coverage than the v2 image. | Existing source coverage is not replaced by large exports or invented fabric in this stage. |
| The dev-only route-runner toolbar can clip horizontally on narrow mobile captures. | Stage 8.10 owns the broader mobile/accessibility pass. Base-map geometry and attribution remain aligned. |
| Mobile submitted-review map projection is less conclusive than desktop. | Stage 8.8.2 changed base-map styling only. Stage 8.9 overlay behaviour and Stage 8.10 mobile layout are preserved. |
| Existing hint text/timing/content remains as committed before this stage. | Hints are an explicit non-goal for Stage 8.8.2 and were not changed. |

## Explicit Non-Goals Preserved

Route generation, legality, matching, snapping, scoring, training exercise
behaviour, learner progress, hint timing/layout/counters, beta
submission/review behaviour, shared submission drawers, authentication,
payments, deployment, the mobile QA toolbar and Stage 8.10 work were not
changed.

## Validation

Final validation on the completed tree:

- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: passed, 1,222 tests, 0 failures.
- `npm.cmd test`: passed all chained suites, including the map suite and the
  shared route submission / compact hint timing regressions.
- `npm.cmd run build`: passed, including compilation, type checking and 70
  generated static pages.
- `git diff --check`: passed; only existing LF-to-CRLF working-copy notices
  were emitted.

## Acceptance

Stage 8.8.2 moves the base map toward the revised v2 examination-atlas
appearance through reusable, source-backed density and hierarchy rules. It does
not use the v2 image as product data, does not alter learner/review/hint
behaviour and does not start Stage 8.10.
