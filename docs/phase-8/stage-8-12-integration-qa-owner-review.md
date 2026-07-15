# Stage 8.12: Integration QA, Archive Manifest, and Owner Review Pack

## Status

Stage 8.12 is the non-final Phase 8 integration-QA and archive-readiness pass.
The evidence, references, deterministic fixtures and reproduction commands are
now indexed and machine-checkable. Phase 8 remains pending owner visual
inspection and is not complete.

The owner may request a focused Stage 8.8.3 visual correction after comparing
the current production evidence with both approved appearance references.
Stage 8.12 does not make that decision and does not retune the map.

## Appearance References

The references control appearance only. They are not production geography and
must never be rendered as a product layer or used to fabricate features.

| Role | Tracked file | SHA-256 |
| --- | --- | --- |
| Primary, denser v2 direction | `references/phase-8-approved-exam-atlas-visual-master-v2.png` | `fe5060154a9e9672250fd49ffb8534bc214bfb7c3b124c0964c8ca5f07e1deba` |
| Secondary, original v1 direction | `references/phase-8-approved-exam-atlas-visual-master.png` | `20800207f7083ca33c7e8e3875211a857b5dd2752f9cab2c7818c420502c7e43` |

The v2 reference sets the stronger direction: greater useful density, tighter
printed-map compression and stronger road-number authority than a spacious
consumer map. Exact geography, labels, symbols, type and colours are not to be
copied.

## Evidence Manifest

All paths below are under `docs/phase-8/screenshots/`.

| Evidence folder | Images | Archive role |
| --- | ---: | --- |
| `stage-8-5/` | 10 | Historical label-density evidence |
| `stage-8-5-correction/` | 4 | Historical principal-view correction |
| `stage-8-6/` | 11 | Historical built-context evidence |
| `stage-8-7/` | 16 | Historical symbol/reference evidence |
| `stage-8-7-a501-correction/` | 2 | Historical A501 association correction |
| `stage-8-7-correction/` | 12 | Historical Stage 8.7 correction evidence |
| `stage-8-8/` | 12 | Retained but visually rejected and superseded |
| `stage-8-8-1/` | 20 | Historical accepted principal-scale correction |
| `stage-8-8-2/` | 19 | Current base-map alignment evidence |
| `stage-8-9/` | 15 | Current learner/review overlay evidence |
| `stage-8-10/` | 23 | Current responsive/accessibility browser evidence |
| `stage-8-11/` | 7 | Current deterministic production-renderer evidence |

Stage 8.11 provides the current regression anchor:

| Fixture | Viewport | State |
| --- | --- | --- |
| `victoria-neutral-desktop` | 1440 by 900 | Dense neutral geography |
| `kings-cross-correct-review-desktop` | 1440 by 900 | Correct review |
| `piccadilly-active-route-desktop` | 1440 by 900 | Active route |
| `waterloo-context-tablet` | 768 by 1024 | Water, bridge and tablet context |
| `waterloo-incorrect-review-mobile` | 390 by 844 | Incorrect review |
| `piccadilly-hint-mobile` | 390 by 844 | Hint over the map |
| `quiet-residential-mobile` | 390 by 844 | Quiet residential context |

The comparator verifies repeated capture directories by exact screenshot
SHA-256 equality. The Stage 8.12 manifest check additionally verifies both
master hashes, every evidence-folder image count, and the hash and dimensions of
all seven committed Stage 8.11 images.

### Missing Or Superseded Evidence

- Stage 8.8's first acceptance was rejected and is retained only as historical
  before-evidence; Stage 8.8.1 and Stage 8.8.2 supersede it.
- Stage 8.4 remains implemented without an independent final manual visual
  acceptance set.
- Stage 8.10 browser evidence does not replace physical-device checks for
  two-finger pinch, orientation changes, cutout/safe-area behavior, feedback
  scrolling or hint interaction.
- Stage 8.11 proves deterministic rendering for its seven fixtures, not final
  cartographic quality across London.

## Owner Visual QA Checklist

Review the images at normal displayed size, first against v2 and then v1.
Record pass, correction requested, or not applicable for each item:

- Dense, useful local-street coverage without unexplained empty beige fields.
- Broad flat-yellow major-road corridors with crisp dark edges and legible
  junction structure.
- Genuine red A/B references that are prominent, bounded and attached to their
  rendered road geometry.
- Compact, frequent source-backed labels with useful district/place hierarchy.
- Continuous building fabric and legible land-use context in dense areas.
- Readable parks, water, rail, bridges, stations, institutions and compact
  contextual symbols where source data supports them.
- Learner routes, markers, hints, mistakes and correct/incorrect review
  overlays remain clear above the base map without concealing too much context.
- Desktop, tablet and mobile layouts have no horizontal overflow or clipped
  critical controls, labels or attribution.
- The product supports independent atlas scanning and does not feel like
  turn-by-turn consumer navigation.
- OSM attribution remains visible wherever OSM-derived geography is rendered.

Normal-size Stage 8.12 inspection found the current production evidence dense,
source-backed and internally consistent. Major corridors, red references,
built fabric, labels, water and bridge context are visible; routes and review
surfaces remain above the map. Compared with v2, the current output remains
less typographically compressed and less uniformly dense. That difference is
an owner decision, not an automated acceptance result.

## Candidate For Stage 8.8.3

Open Stage 8.8.3 only if owner review identifies a material visual gap. Candidate
items are:

- increase useful source-backed local-label or building density where the
  current production view still feels substantially more open than v2;
- tighten district/place hierarchy if it reads too large or consumer-like;
- rebalance major-road width, casing or junction authority if corridors feel
  either weak or overpowering at displayed 100%;
- strengthen genuine A/B reference prominence or spacing without repetition;
- enrich missing bridge, river, rail, station, park, civic or institutional
  context only after confirming the fixture contains that source data;
- correct mobile clipping, overload or excessive suppression found during
  owner or physical-device inspection.

Any correction must be reusable, source-backed and independently validated.
The visual masters must not supply geography or screenshot-specific constants.

## Reproduction

Verify the archive manifest:

```powershell
npm.cmd run map:qa:phase8-owner-review
```

Run the documented local application and open a deterministic fixture such as:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3011
```

`/dev/route-runner/visual-regression/victoria-neutral-desktop`

The other fixture ids are the names in the Stage 8.11 table. Follow
`stage-8-11-deterministic-visual-regression.md` for the browser capture process.
Compare two capture directories with:

```powershell
npm.cmd run map:visual:compare:phase8 -- <run-a> <run-b>
```

Run the complete automated validation sequentially:

```powershell
npm.cmd run lint
npm.cmd run test:map
npm.cmd test
npm.cmd run build
git diff --check
```

Finally, repeat the physical checks listed above and inspect both references
and representative desktop, tablet and mobile evidence side by side at normal
size. Automated success and byte-identical PNGs do not complete Phase 8.

## Validation Results

Validation completed on 15 July 2026:

- `npm.cmd run map:qa:phase8-owner-review`: passed; 2 references, 12 evidence
  folders and 7 deterministic screenshots matched the archive manifest.
- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: 1,229 passed, 0 failed, 0 skipped.
- `npm.cmd test`: all required constituent suites passed, 0 failed and 0
  skipped.
- `npm.cmd run build`: passed. Six static pages exceeded the first 60-second
  prerender attempt, retried automatically, and all 70 pages completed.
- `git diff --check`: passed.

## Preserved Non-Goals

Stage 8.12 changes no cartographic styling or source geography. It changes no
route generation, legality, matching, snapping, scoring, hints, submissions,
reviews, authentication, subscriptions, deployment or learner progress. The
historical stash remains outside this evidence pack and must remain untouched.
