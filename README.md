# TopoPass

TopoPass is a responsive learning web app for London private-hire applicants.
It supports Topographical and SERU study through focused practice, route
planning, route drawing, mock assessments, review, and progress tracking.

TopoPass is an independent study tool. It is not affiliated with, endorsed by,
or sponsored by Transport for London or any private-hire operator. It does not
provide official questions, certification, or a pass prediction.

## Current status

The current product has a complete local-first learning loop, optional
Supabase-backed accounts, a beta-ready Real London route engine, accepted
examination-atlas cartography, and a controlled-beta Exam Mode.

As of 17 July 2026:

- Phase 8 cartography is accepted and closed.
- Phase 9 Exam Mode is complete and ready for a controlled learner beta.
- Phase 10 is planning only; its proposed learner-experience redesign has not
  been implemented.
- Phase 7 is paused with a working 15-route curated beta pack; it is not marked
  complete.
- The TOPOPASS AWS deployment is ready for public-IP smoke testing, but its
  production domain and HTTPS cutover remain deferred.
- PC Ready domain, Cloudflare routing, and Zoho Mail setup are complete as a
  separate operational track.

## Phase roadmap

The README intentionally keeps phase descriptions brief. Open a phase link for
its stage-by-stage history, boundaries, validation, and remaining work.

| Phase | Status | Brief description | Detail |
| --- | --- | --- | --- |
| 1 - Prototype foundation | Complete | Established the application shell, knowledge/map-click/route questions, route scoring, mock exams, review, and local admin prototypes. | [Phase 1](docs/PHASE_1_CLOSURE.md) |
| 2 - Learning MVP hardening | Complete | Added local progress, mistake review, learning feedback, broader content, stronger route/map interactions, and mobile/accessibility work. | [Phase 2](docs/phase-2-learning-mvp.md) |
| 3 - Backend foundation | Complete | Added Supabase accounts and persistence, protected admin publishing, seed/import/export tooling, production-safe errors/logging, and launch polish. | [Phase 3](docs/phase-3-backend-foundation.md) |
| 4 - Deployment and domains | IP smoke-test ready | Added Docker, ECR publishing, Terraform/EC2, Caddy, monitoring, backups, scheduling, and the separate completed PC Ready DNS/email record. | [Phase 4](docs/phase-4-deployment.md) |
| 5 - Real London beta | Complete and frozen | Built the route graph, matching, legality, scoring, review, OSM import, Real London fixtures, beta feedback, and readiness gates. | [Phase 5](docs/phase-5-beta-ready.md) |
| 6 - Learner-map cartography | Complete | Matured the first-generation Real London visual system, overlays, responsive interaction, performance, fixtures, and visual QA. | [Phase 6](docs/phase-6-real-london-cartography.md) |
| 7 - Learner Training Mode | Paused | Provides Training Mode, route authoring tools, and 15 curated beta routes; wider curriculum and workflow maturity remain unfinished. | [Phase 7](docs/phase-7-paused-state.md) |
| 8 - Examination atlas | Complete and accepted | Replaced the Phase 6 appearance target with a dense, source-backed examination-atlas design and deterministic visual evidence. | [Phase 8](docs/phase-8/README.md) |
| 9 - Exam Mode | Complete; beta-ready | Added timed independent route attempts, post-submit scoring/review, local history, a readiness dashboard, and integrated QA. | [Phase 9](docs/phase-9/README.md) |
| 10 - Guided learning platform | Planning only | Defines a future subject-led learner experience while protecting Phase 8 cartography and Phase 9 behaviour. | [Phase 10](docs/phase-10/README.md) |

## What the app supports

### Topographical learning

- Knowledge, map-click, and route-drawing practice
- Real London and fictional development map fixtures
- Source-backed road restrictions, legal-route matching, and deterministic
  route scoring
- Training Mode with hints, feedback, progress, and curated learner routes
- Exam Mode with no active-attempt hints, submission locking, scoring, review,
  local history, and readiness evidence
- Topographical mock tests, mistake review, answer history, and progress
  summaries

### SERU learning

- A separate SERU learning journey rather than mixed topographical content
- PHV handbook practice by section or across all sections
- Sentence-completion, advanced English, and reading-understanding practice
- A dedicated SERU mock test
- SERU-aware progress and review summaries

### Accounts, content, and operations

- Signed-out browser-local progress
- Optional Supabase authentication and account-scoped progress
- Role-protected admin question inventory and publishing controls
- Draft/published/archived question states with validated import/export
- Draft-first seed content and safe production logging
- Docker/EC2 deployment support, health checks, monitoring, backups, and
  operational documentation

## Technology

| Area | Implementation |
| --- | --- |
| Web application | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS |
| Persistence | Browser local storage plus optional Supabase |
| Maps | Custom route/map engine, committed OSM-derived fixtures, canvas/SVG rendering, and Mapbox for legacy map-click flows |
| Validation | Node test runner, ESLint, TypeScript through the Next.js build, and deterministic map/visual QA scripts |
| Deployment | Docker, Docker Compose, GitHub Actions, Amazon ECR, Terraform, EC2, Caddy, and CloudWatch |

## Run locally

Install dependencies:

```powershell
npm.cmd install
```

Copy [`.env.example`](.env.example) to an untracked `.env.local`, then add only
the values needed for the flows you want to test:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- Supabase values are optional for signed-out local practice and required for
  account-backed/admin behaviour.
- The Mapbox token is required for existing Mapbox map-click pages.
- Never commit passwords, service-role keys, tokens, cookies, or populated
  environment files.

Start the development server:

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

## Test and build

Run the standard checks:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
```

Useful focused commands include:

```powershell
npm.cmd run test:training
npm.cmd run test:phase5-beta-readiness
npm.cmd run test:shared-route-submission
npm.cmd run map:audit:phase8
npm.cmd run map:qa:phase8-owner-review
```

See [`package.json`](package.json) for every test and map-data command. The full
map suite is intentionally broad and can take considerably longer than a
focused test during development.

## Main application areas

| Area | Routes |
| --- | --- |
| Public product pages | `/`, `/topographical`, `/seru`, `/course`, `/demo`, `/resources`, `/pricing` |
| Learner home | `/dashboard`, `/learn`, `/practice` |
| Topographical practice | `/practice/topographical`, `/practice/knowledge`, `/practice/map-click`, `/practice/routes` |
| Route modes | `/practice/training`, `/practice/exam-mode`, `/practice/real-london` |
| Assessments | `/mock-test`, `/practice/seru/mock-test` |
| SERU practice | `/practice/seru` and its handbook, English, and reading routes |
| Progress and review | `/progress`, `/progress/mistakes`, `/review` |
| Account | `/auth/*`, `/account` |
| Admin | `/admin` and `/admin/questions/*` |
| Developer tools | `/dev`, `/dev/route-runner`, `/dev/training-route`, `/dev/library` |

Developer tools and visual-QA routes are internal surfaces. They should not be
added to learner navigation or treated as production learner features.

## Data and content

- Production starter questions:
  [`supabase/seed/question_bank_items.json`](supabase/seed/question_bank_items.json)
- Database migrations: [`supabase/migrations`](supabase/migrations)
- Complete curated learner routes:
  [`data/training-routes/complete`](data/training-routes/complete)
- Map data and attribution rules: [map-data guide](docs/map-data.md)
- Production question workflow:
  [production-question-content.md](docs/production-question-content.md)
- Training route authoring and dev tools:
  [dev-training-tools.md](docs/dev-training-tools.md)

Run the guarded question seed only with an authenticated Supabase admin account:

```powershell
npm.cmd run seed:questions
```

## Deployment and DNS

- AWS architecture, EC2 operations, Caddy, monitoring, backups, and recovery:
  [AWS deployment guide](docs/aws-ec2-devops-deployment.md)
- Terraform inputs and lifecycle:
  [Terraform guide](infra/terraform/README.md)
- Manual production gate: [AWS go-live checklist](AWS_GO_LIVE_CHECKLIST.md)
- PC Ready's separate Fasthosts/Cloudflare/Zoho configuration:
  [PC Ready domain and email setup](docs/pc-ready-domain-email-setup.md)

Do not infer that PC Ready's completed Cloudflare setup finishes the separate
TOPOPASS EC2 domain/HTTPS cutover.

## Important limitations

- Phase 7 remains paused; its 15-route pack is a beta foundation, not a complete
  learner curriculum.
- Exam progress and readiness evidence are local to one browser profile and are
  not currently account-synchronised.
- Route coverage and scoring still require evidence from controlled learner
  beta use before broader claims or expansion.
- Payments are not active; plan and upgrade surfaces are preparatory only.
- Typed analytics events exist, but no third-party analytics provider is wired.
- Physical-device Safari/Chrome touch, orientation, browser-zoom, reduced-motion,
  and high-contrast checks remain recommended before widening the beta.
- The TOPOPASS public-IP environment is for controlled smoke testing, not broad
  production onboarding or payment handling.

## Documentation index

- [Manual QA checklist](docs/MANUAL_QA_CHECKLIST.md)
- [Mobile and accessibility QA](docs/mobile-accessibility-qa.md)
- [Technical debt](docs/TECHNICAL_DEBT.md)
- [Phase 7 training architecture](docs/phase-7-learner-training-architecture.md)
- [Phase 7 curated route pack](docs/phase-7-curated-route-pack.md)
- [Phase 8 visual QA plan](docs/phase-8/phase-8-visual-qa-plan.md)
- [Phase 9 final beta-readiness evidence](docs/phase-9/stage-9-7-final-exam-simulation-qa-and-beta-readiness.md)
- [Phase 10 feedback register](docs/phase-10/raw-feedback-register.md)
