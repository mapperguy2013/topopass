# TopoPass

TopoPass is a responsive study web app for London private hire applicants
preparing for TfL-style private hire learning. It helps learners practise
topographical map reading, location knowledge, point-to-point route planning,
route drawing, mock-test decision making, mistake review, and separate
SERU-style private hire knowledge.

TopoPass is an independent study tool. It is not affiliated with, endorsed by,
or sponsored by Transport for London, Uber, Bolt, FREENOW, or any private hire
operator.

## Current Status

Phase 1 and Phase 2 are complete.

The app is currently a local-first Learning MVP. Learners can use the complete
prototype practice loop with local browser persistence, progress analytics,
mistake review, explanations, learning tips, mock exam modes, route drawing,
map-click questions, and admin/content tooling.

Phase 3 is complete. It added Supabase schema and helpers, optional learner
accounts, account-backed progress persistence, admin role protection, question
publishing, admin-only question import/export, production seed content, app
error/loading states, production-safe logging, account data isolation checks,
full `/review` answer history, and a simpler mock exam flow where map-click and
route-planning questions continue with Next after a valid answer.

Stage 36 is complete as a post-Phase-3 content-readiness pass. It expands the
draft-first production question seed, standardises the question topic structure,
keeps learner reads published-only, and improves admin inventory organisation
with topic, status, and difficulty filters.

Stage 37 is complete as a post-Phase-3 learner/admin polish pass. It adds
topic-based practice entry points, focused practice-session summaries, clearer
answer feedback and wrong-answer review, admin batch publish/archive actions,
and admin-only learner previews for question review.

Stage 38 is complete as a learner experience polish pass. It refreshes the
public home page, improves `/progress` and `/account` dashboards with topic
strengths/weaknesses and recent activity, and makes mock exam results/review
clearer with pass/fail guidance and topic breakdowns.

Stage 39 is complete as a launch-readiness and conversion polish pass. It
refreshes the public homepage with a cleaner learning-map visual, positions
SERU-style preparation as a separate product area, improves the pricing
placeholder, adds public-page SEO/social metadata, and introduces a no-op typed
analytics event structure for future provider wiring.

Stage 39.5 is complete as a SERU practice foundation pass. It adds a separate
SERU-style starter practice area, original SERU question bank content,
SERU-aware review/progress summaries, and homepage separation polish while
keeping topographical mock exams free of SERU questions.

Stage 39.6 is complete as a practice journey, demo clarification, and
navigation polish pass. It turns `/practice` into a clearer learner hub,
moves topographical topic selection to `/practice/topographical`, improves the
SERU-style practice page, clarifies that `/demo` is only a short public preview,
and separates public navigation from signed-in learner navigation.

Stage 39.7 is complete as a public assessment-page and logged-out navigation
polish pass. It adds public `/topographical` and `/seru` information pages,
adds a signed-out Course dropdown for course discovery, adds a public `/course`
page explaining how the course works, keeps those public pages free of the
learner sidebar, and splits Demo into short Topographical and SERU previews
rather than full Practice.

Stage 40 is complete as a monetisation foundation and beta-launch prep pass. It
adds a simple Free, Plus, and Pro plan model, shows Free plan status in account,
upgrades `/pricing` into a launch-ready preview with safe upgrade-interest
capture, adds light upgrade-coming-soon placeholders, and keeps payment
processing intentionally inactive. The additional Stage 40 footer pass adds a
full public footer, Supabase-backed newsletter signup, placeholder social icons,
and beta-ready information/legal pages.

Phase 4 is complete for IP-based launch readiness. The current deployment
target is a Dockerised Next.js app on one EC2 instance, pushed via GitHub
Actions/ECR, exposed through Caddy, and connected to the existing managed
Supabase project through runtime env configuration. Domain, Route 53, and real
HTTPS work are paused so the EC2 deployment can be smoke-tested over plain HTTP
at `http://13.134.170.158`.

The app should continue to work without Supabase credentials for current local
learner flows. Supabase credentials are required for account features,
account-backed progress records, and admin publishing controls.

## Completed Phase 1: Prototype Foundation

Phase 1 established the core product shape and working prototype flows:

- Core Next.js app structure
- Public homepage, Learn, Practice, Mock Test, Resources, Pricing, and Admin
  areas
- Knowledge question bank and exact-answer scoring
- Map-click question bank with coordinate distance scoring
- Route-drawing question bank
- Route drawing over an OpenStreetMap-derived local SVG map
- Route scoring with start, end, coverage, length, off-route, and bounds checks
- Timed mixed mock exam engine
- Question navigation, unanswered-state tracking, and result review
- Static/local question banks for all supported question types
- Prototype admin tools for knowledge, map-click, and route questions
- Browser-local admin draft workflows
- Validation and preview tools for learner-facing question behaviour
- Deterministic tests for scoring, mock exam selection, and question validation

## Completed Phase 2: Learning MVP Hardening

Phase 2 turned the prototype into a stronger local Learning MVP:

- Local progress persistence
- Progress dashboard
- Mistake review flow
- Visual answer review for map-click and route questions
- Explanations and learning tips across supported question types
- Personalised practice recommendations
- Expanded knowledge, map-click, route, learn, and mock exam content
- Mock exam modes for practice, exam simulation, weak areas, and mistakes
- Smarter review flow and retry queues
- Route drawing correction and map interaction polish
- Map-click interaction polish
- Route drawing pan, zoom, reset, undo, clear, and submit controls
- Local atlas-page support structure and QGIS/OS atlas workflow documentation
- Cleanroom generated driver-training atlas review asset
- Learn section expansion
- Accessibility and mobile QA improvements
- Mobile/touch target hardening and keyboard focus improvements

## Completed Phase 3: Backend Foundation And Production Readiness

Phase 3 completed the real product infrastructure needed before Phase 4.
Phase 4 has now started as deployment preparation only.

| Stage | Focus | Status |
| --- | --- | --- |
| Stage 27 | Supabase setup and database schema | Complete |
| Stage 28 | User accounts / authentication | Complete |
| Stage 29 | Save progress to database | Complete |
| Stage 30 | Admin authentication and protected admin area | Complete |
| Stage 31 | Question publish workflow: draft, published, archived | Complete |
| Stage 32 | Import/export question tools | Complete |
| Stage 33 | Production seed data and content migration | Complete |
| Stage 34 | Error handling, loading states, and production logging | Complete |
| Stage 35.6 | Account data isolation, review history, and exam UX improvements | Complete |

Phase 3 guardrails:

- Do not replace the local practice loop prematurely.
- Do not require login for current local learner flows yet.
- Do not expose service-role or private Supabase keys to frontend code.
- Do not add external monitoring services until there is a deliberate product
  decision to do so.

## Phase 4: Low-Cost AWS DevOps Deployment

Phase 4 is complete for IP-based launch readiness. The project now has the
Docker, GitHub Actions, Terraform, EC2 Compose, Caddy, runtime secret fetch,
health check, update helper, and operations documentation needed to run the
current app on a single EC2 host for controlled smoke testing.

This is not the final public launch configuration. Domain, Route 53, and real
HTTPS domain setup are deferred. Do not use the temporary HTTP public-IP
deployment for payments or broad learner onboarding.

Current target architecture:

- GitHub Actions builds and publishes Docker images to ECR.
- AWS ECR stores the TopoPass Next.js app image.
- One EC2 instance runs Docker Compose.
- The app container runs on internal port `3000`.
- Caddy exposes port `80` for the temporary public-IP HTTP smoke test.
- Port `443`, Route 53, and the production domain are reserved for the later
  HTTPS launch path.
- CloudWatch will collect logs and basic host/app metrics.
- Managed Supabase remains the current backend through the existing
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` runtime
  configuration. Self-hosted Supabase containers are not included in the
  production Compose stack yet.

Stage 40 deployment-prep status:

| Item | Status |
| --- | --- |
| Production `Dockerfile` | Added |
| `.dockerignore` | Added |
| Next.js standalone build output | Enabled |
| Production env template | Added at `.env.production.example` |
| Docker Compose app template | Added at `deploy/docker-compose.prod.yml` |
| AWS EC2 deployment guide | Added at `docs/aws-ec2-devops-deployment.md` |
| Managed Supabase retained | Yes |
| Self-hosted Supabase | Not added |
| Real production secrets | Not added |
| AWS deployment | Not run |

Stage 41 Dockerisation status:

| Item | Status |
| --- | --- |
| Root `docker-compose.yml` for local/EC2 app runs | Added |
| Docker runtime env example | Added at `.env.docker.example` |
| Docker helper npm scripts | Added |
| App service healthcheck | Added |
| App service runs as non-root user | Yes |
| Self-hosted Supabase | Not added |
| Product features/UI changed | No |

Step 42 ECR publishing status:

| Item | Status |
| --- | --- |
| GitHub Actions Docker publish workflow | Added |
| Push trigger on `main` | Added |
| Manual `workflow_dispatch` trigger | Added |
| GitHub OIDC AWS role assumption | Configured |
| Amazon ECR login | Configured |
| Docker image tags | Git SHA and `latest` |
| EC2 deployment logic | Not added |
| ECS/Fargate/ALB/Terraform | Not added |

Stage 43 Terraform EC2 infrastructure status:

| Item | Status |
| --- | --- |
| `infra/terraform` root module | Added |
| EC2 production host | Configured |
| Docker and Docker Compose install through `user_data` | Configured |
| Persistent EBS data volume | Configured |
| Elastic IP | Configured |
| HTTP security group | Configured for port `80`; port `443` paused |
| SSH disabled by default | Configured |
| SSM Session Manager IAM access | Configured |
| ECR pull IAM permission | Configured |
| CloudWatch agent/log support | Configured |
| Optional Route 53 A record | Configured |
| Daily EBS snapshots | Configured |
| App secrets in Terraform | Excluded |

Step 44 domain/HTTPS reverse proxy status:

| Item | Status |
| --- | --- |
| Caddy production reverse proxy | Added |
| Caddyfile | Added at `deploy/Caddyfile` |
| App HTTP route | Configured through `APP_DOMAIN=:80` for the public IP |
| WWW redirect | Paused until Route 53/domain/HTTPS resumes |
| Supabase gateway HTTPS route | Paused until self-hosted Supabase/domain work resumes |
| Production Compose public ports | Caddy on `80`; `443` reserved for later HTTPS |
| App direct public port | Removed from production template |
| Supabase Studio public exposure | Not added |
| Route 53 apex/www/Supabase records | Configured in Terraform, disabled by default |
| Real domain/secrets/certificates | Not added |

Step 45 monitoring/backups status:

| Item | Status |
| --- | --- |
| Public app health endpoint | Added at `/api/health` |
| Production app healthcheck | Uses `/api/health` |
| Caddy healthcheck | Added |
| CloudWatch agent config | Added at `infra/monitoring/cloudwatch-agent.json` |
| CloudWatch log retention | Configured in Terraform |
| CloudWatch alarms | EC2 status, CPU, memory, disk |
| SNS alert topic | Configured, optional email subscription |
| AWS Budget monthly cost monitor | Configured |
| AWS Budget kill switch | Optional, disabled by default |
| S3 backup bucket | Configured with public block, encryption, versioning, lifecycle |
| EC2 backup IAM policy | Scoped to backup bucket/prefix |
| Postgres backup script | Added at `infra/backups/backup-postgres.sh` |
| Optional storage backup script | Added |
| Backup verification script | Added |
| Systemd backup timer examples | Added |
| Restore runbook | Added |
| Real secrets/backups | Not added |

Step 47.6 scheduled EC2 start/stop status:

| Item | Status |
| --- | --- |
| EventBridge Scheduler daily EC2 stop | Configured for `02:00 Europe/London` |
| EventBridge Scheduler daily EC2 start | Configured for `09:00 Europe/London` |
| Scheduler IAM role | Start/stop only for the TopoPass EC2 instance ARN |
| Persistent EBS data volume | Preserved when EC2 stops |
| Compose app restart after boot | Handled by `topopass-compose.service` |
| Schedule disable path | `enable_ec2_schedule = false` |

Step 48A public-IP HTTP deployment status:

| Item | Status |
| --- | --- |
| Temporary public URL | `http://13.134.170.158` |
| Domain / Route 53 | Paused |
| HTTPS / certificates | Paused |
| Active public Compose port | `80` only |
| Terraform public ingress | Port `80`; optional restricted SSH only |
| App direct public port | Still not published |
| `NEXT_PUBLIC_SITE_URL` for smoke test | `http://13.134.170.158` |
| Health endpoint | `/api/health` returns `ok`, `service`, and `timestamp` |

Phase 4 final status:

| Area | Status |
| --- | --- |
| IP-based EC2 smoke-test readiness | Complete |
| Production app image publishing | GitHub Actions to private ECR |
| Production runtime | EC2 Docker Compose with Caddy on port `80` |
| App health endpoint | `/api/health` |
| Runtime env handling | AWS Secrets Manager fetches to host-only env files |
| Public app port | Caddy on `80`; app port `3000` remains Docker-internal |
| Backend | Existing managed Supabase project |
| Self-hosted Supabase | Deferred |
| Domain / Route 53 / real HTTPS | Deferred |
| Payments / monetisation | Deferred |

Production operations checklist:

```bash
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
docker compose config
docker build -t topopass-web:phase4-final .
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
```

EC2 update command:

```bash
update
```

EC2 smoke-test routes:

```bash
curl -I http://13.134.170.158
curl -I http://13.134.170.158/practice
curl -I http://13.134.170.158/practice/seru/phv-handbook
curl -fsS http://13.134.170.158/api/health
```

Rollback and recovery notes:

- Git-tracked deploy scripts, Compose files, Caddy config, and Terraform can be
  restored from the repository.
- The production image can be repointed to a known-good ECR tag with
  `TOPOPASS_IMAGE`, then the Compose stack can be recreated with `update` or
  `docker compose -f deploy/docker-compose.prod.yml up -d --force-recreate`.
- Runtime env values should be restored from AWS Secrets Manager with
  `sudo bash infra/deploy/fetch-runtime-env.sh`.
- A fresh EC2 rebuild flow is documented in the EC2 rebuild recovery section
  below.

Final Phase 4 verification on 2026-06-26:

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed |
| `npm.cmd test` | Passed, including `lib/deployment/productionOps.test.ts` |
| `npm.cmd run build` | Passed |
| `git diff --check` | Passed |
| `docker compose config` | Passed |
| `docker compose -f deploy/docker-compose.prod.yml config` | Passed with example env files |
| `docker build -t topopass-web:phase4-final .` | Passed |
| Local container smoke test | `/api/health` and `/` returned HTTP `200` |
| `terraform -chdir=infra/terraform fmt -recursive` | Passed |
| `terraform -chdir=infra/terraform validate` | Passed |
| `terraform -chdir=infra/terraform plan -no-color` | Passed with no changes; no EC2 replacement |
| `curl -I http://13.134.170.158` | HTTP `200` |
| `curl -I http://13.134.170.158/practice` | HTTP `200` |
| `curl -I http://13.134.170.158/practice/seru/phv-handbook` | HTTP `200` |
| `curl -fsS http://13.134.170.158/api/health` | Returned safe health JSON |

Terraform apply was not run during this final verification pass.

Next phase:

- Add a real custom domain, Route 53 records, and HTTPS.
- Add payment and monetisation plumbing.
- Complete final content QA across Topographical and SERU practice.
- Improve production analytics and monitoring after real usage begins.
- Run structured real-user testing before broad launch.

Phase 4 checklist:

- [x] Docker build support exists.
- [x] Production env template exists with placeholders only.
- [x] AWS EC2 architecture is documented.
- [x] Docker Compose app-only production template exists.
- [x] Root Docker Compose app runner exists.
- [x] Docker helper scripts exist.
- [x] GitHub Actions ECR image publishing workflow exists.
- [x] Terraform EC2 production target exists.
- [x] No real secrets are committed.
- [x] Caddy reverse proxy template exists.
- [x] Route 53 apex, www, and Supabase gateway records are configurable.
- [x] Health endpoint exists for app/container checks.
- [x] S3 logical backup bucket is defined in Terraform.
- [x] Backup scripts and restore runbook exist.
- [x] CloudWatch log groups, alarms, and SNS alerting are defined.
- [x] AWS Budget cost monitor and optional EC2 stop kill switch are defined.
- [x] EventBridge Scheduler daily EC2 start/stop cost-saving schedules are defined.
- [x] Temporary public-IP HTTP smoke-test path is documented.
- [x] Private ECR image target is documented and used by the production
      Compose template.
- [x] GitHub OIDC/ECR publishing workflow is documented.
- [x] Terraform EC2 host provisioning files exist.
- [x] Production runtime env fetch from AWS Secrets Manager is documented.
- [x] Production Caddy/App Compose stack is documented.
- [ ] Add or attach a self-hosted Supabase stack to the `topopass-prod`
      Docker network if the future self-hosted backend path is chosen.
- [ ] Verify Route 53 DNS points to the EC2 Elastic IP when domain work resumes.
- [ ] Confirm CloudWatch agent logs and metrics arrive after deployment.
- [ ] Confirm SNS email subscription if `alert_email` is set.
- [ ] Confirm AWS Budget email subscription if `budget_alert_email` is set.
- [ ] Keep `enable_budget_kill_switch = false` until the budget alert path is tested.
- [ ] Run and verify the first Postgres backup before any self-hosted database
      launch.
- [ ] Enable the Postgres backup systemd timer only after a successful manual
      backup.
- [ ] Complete a restore drill before any self-hosted database launch.
- [x] Production smoke test on the deployed host.

Phase 4 guardrails:

- Do not commit `.env`, `.env.local`, `.env.production`, or production
  credentials.
- Do not bake secrets into Docker images.
- Do not expose Supabase service-role keys to browser code.
- Keep runtime env files only on EC2 or in GitHub Secrets where required.
- Keep app secrets out of Terraform variables and Terraform state.
- Keep database passwords in host-only env files.
- Do not upload raw `.env` files to S3.
- Keep signed-out local progress working.
- Keep signed-in Supabase progress working.
- Keep Topographical and SERU product areas separate.

Stage 48A public EC2 hardening checklist:

- Temporary public URL: `http://13.134.170.158`
- Domain, Route 53, HTTPS, Certbot, Let's Encrypt, CloudFront, ALB, and paid
  DNS resources remain paused.
- Security group should expose only port `80` publicly. Port `443` stays
  closed until the domain/HTTPS stage resumes.
- SSH stays disabled by default or restricted to the owner CIDR only.
- Public ports `3000`, `5432`, `8000`, Supabase Studio ports, and local
  Supabase dev ports must stay closed.
- Caddy is the only public container and reverse proxies to `app:3000` on the
  Docker network.
- Production containers use `restart: unless-stopped`; the optional systemd
  service restarts the Compose stack after EC2 boot.
- Health check:

```bash
curl -fsS http://13.134.170.158/api/health
```

Expected shape:

```json
{"ok":true,"service":"topopass","timestamp":"2026-06-26T00:00:00.000Z"}
```

- Server smoke-test commands:

```bash
cd /srv/topopass
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs --tail 100 caddy
curl -I http://13.134.170.158
curl -fsS http://13.134.170.158/api/health
```

- Update command:

```bash
update
```

`update` is installed from `infra/deploy/update`. It pulls Git changes, logs in
to ECR through the EC2 instance role, pulls Compose images, recreates the stack,
shows container status, and checks `http://127.0.0.1/api/health` without
printing secrets.

- Backup commands:

```bash
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/backup-postgres.sh --dry-run
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/backup-postgres.sh
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/verify-latest-backup.sh
```

These backup commands are for the future self-hosted Postgres/Supabase path.
The current app still points at managed Supabase, so provider/project backup
settings must be reviewed there separately.

Do not commit backup files, dump files, tar archives, logs, `.env` files,
Terraform state, Caddy data/certificates, `node_modules`, `.next`, or build
outputs.

Local Docker commands:

```powershell
Copy-Item .env.docker.example .env.docker
npm.cmd run docker:build
npm.cmd run docker:up
npm.cmd run docker:logs
npm.cmd run docker:down
```

EC2-oriented Docker notes:

- Copy or pull the repository on the EC2 host.
- Create the runtime env file on the server, for example `.env.docker` for the
  root compose file or `/srv/topopass/env/app.env` for the production deploy
  template.
- For the temporary public-IP smoke test, create `/srv/topopass/env/proxy.env`
  with `APP_DOMAIN=:80`.
- Set `NEXT_PUBLIC_SITE_URL=http://13.134.170.158` in the runtime app env.
- Keep Supabase public URL values pointed at the existing managed Supabase
  project until the later self-hosted/domain stage.
- Set `TOPOPASS_APP_ENV_FILE=/srv/topopass/env/app.env` and
  `TOPOPASS_PROXY_ENV_FILE=/srv/topopass/env/proxy.env` on the host.
- Run `docker compose -f deploy/docker-compose.prod.yml config`.
- Run `bash infra/deploy/deploy-ec2-compose.sh` or the public-IP smoke-test
  commands documented in `docs/aws-ec2-devops-deployment.md`.
- After one successful manual deployment, install the boot-time service with
  `sudo cp infra/deploy/systemd/topopass-compose.service /etc/systemd/system/`
  and `sudo systemctl enable --now topopass-compose.service`.
- Check Caddy logs with
  `docker compose -f deploy/docker-compose.prod.yml logs -f caddy`.
- Do not commit runtime env files, real secrets, `.next`, `node_modules`, build
  outputs, or Docker local artifacts.

EC2 rebuild and recovery notes:

Current production EC2 deployment reference:

| Item | Current value |
| --- | --- |
| AWS region | `eu-west-2` |
| Public IP | `13.134.170.158` |
| Instance ID | `i-008798ec45e9cb274` |
| ECR image | `006419716542.dkr.ecr.eu-west-2.amazonaws.com/topopass-web:latest` |
| Runtime secret | `topopass/production/app-env` |
| App directory | `/srv/topopass` |
| Compose file | `deploy/docker-compose.prod.yml` |
| Runtime app env file | `/srv/topopass/env/app.env` |
| Runtime proxy env file | `/srv/topopass/env/proxy.env` |
| Systemd service | `topopass-compose.service` |

If the EC2 instance is destroyed, rebuilt, or replaced, these items survive
outside the host:

- Git-tracked files survive because they are in the repository.
- Terraform can recreate infrastructure from `infra/terraform`.
- ECR images survive because they are stored outside EC2.
- The Secrets Manager value survives in AWS Secrets Manager.
- Docker containers can be recreated from ECR images with Docker Compose.

These items do not automatically survive a fresh EC2 host:

- `/usr/local/bin/update`
- `/srv/topopass/env/app.env`
- `/srv/topopass/env/proxy.env` unless recreated or fetched again
- running Docker containers
- manually created files that were never committed to Git
- the installed `topopass-compose.service` systemd unit unless reinstalled

Fresh EC2 recovery flow:

```bash
sudo git clone https://github.com/mapperguy2013/topopass.git /srv/topopass
cd /srv/topopass

sudo bash infra/deploy/fetch-runtime-env.sh

sudo cp infra/deploy/update /usr/local/bin/update
sudo chmod +x /usr/local/bin/update

sudo cp infra/deploy/systemd/topopass-compose.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now topopass-compose.service

update
```

Recovery source table:

| Item | Recovery source |
| --- | --- |
| Application source, Docker Compose, Caddyfile, deploy scripts | Git |
| EC2, Elastic IP, security groups, IAM, EBS, CloudWatch, backup resources | Terraform |
| Production app image | ECR |
| Runtime app dotenv content | AWS Secrets Manager |
| `/srv/topopass/env/app.env` | Recreate with `sudo bash infra/deploy/fetch-runtime-env.sh` |
| `/srv/topopass/env/proxy.env` | Recreate manually from documented host values |
| `/usr/local/bin/update` | Reinstall from `infra/deploy/update` |
| `topopass-compose.service` | Reinstall from `infra/deploy/systemd/topopass-compose.service` |
| Running containers | Recreate with `update` or Docker Compose |

The update deploy helper lives in Git at `infra/deploy/update`. Install it on
the server with:

```bash
sudo cp infra/deploy/update /usr/local/bin/update
sudo chmod +x /usr/local/bin/update
```

Anything created manually on EC2 should either be committed to Git, stored in
AWS Secrets Manager, managed by Terraform, or clearly documented. Do not store
real secrets in Git, Terraform variables, Terraform state, Docker images, or
README examples.

Step 42 GitHub Actions/ECR setup:

- Create a private ECR repository, for example `topopass/topopass-web`.
- Create an AWS IAM role trusted by GitHub OIDC for this repository.
- Grant the role least-privilege ECR push access for that repository.
- Add these GitHub repository variables:
  - `AWS_REGION`
  - `AWS_ROLE_TO_ASSUME`
  - `ECR_REPOSITORY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_MAPBOX_TOKEN`
  - optional `NEXT_PUBLIC_SITE_URL`
- Add this GitHub repository secret:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do not add AWS access keys to the repository.
- Do not add deployment credentials, service-role keys, or `.env` files.
- Step 42 only publishes the image to ECR. EC2 deployment remains a later stage.

Stage 43 Terraform EC2 setup:

- Terraform lives in `infra/terraform`.
- Copy `infra/terraform/terraform.tfvars.example` to an untracked
  `infra/terraform/terraform.tfvars`.
- Run:

```powershell
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan
```

- Use SSM Session Manager for access by default.
- SSH ingress is disabled unless `ssh_cidr_blocks` is set.
- Runtime `.env.production` values are created manually on the EC2 host or
  supplied later through SSM Parameter Store.
- Do not put Supabase secrets, database passwords, JWT secrets, API keys, or app
  env values in Terraform.

Step 44/48A reverse proxy setup:

- Production Caddy configuration lives in `deploy/Caddyfile`.
- Production Compose lives in `deploy/docker-compose.prod.yml`.
- Caddy is the only production service publishing port `80` during Step 48A.
- Port `443` is closed/paused until Route 53/domain/HTTPS work resumes.
- The app is available only inside the Docker network as `app:3000`.
- The Supabase gateway is expected inside the Docker network as `kong:8000`
  when the self-hosted Supabase stack is attached later.
- Supabase Studio, Postgres, app port `3000`, Kong port `8000`, and local
  Supabase dev ports must not be opened publicly.
- Current Step 48A proxy env on the EC2 host:

```bash
APP_DOMAIN=:80
ACME_EMAIL=admin@example.com
```

- Future domain values should be added only when the domain/HTTPS stage
  resumes:

```bash
APP_DOMAIN=example.com
ACME_EMAIL=admin@example.com
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_SUPABASE_URL=https://supabase.example.com
SUPABASE_PUBLIC_URL=https://supabase.example.com
API_EXTERNAL_URL=https://supabase.example.com
SITE_URL=https://example.com
ADDITIONAL_REDIRECT_URLS=https://example.com,https://www.example.com
```

- Future HTTPS manual checks:
  - `http://example.com` redirects to `https://example.com`.
  - `https://example.com` loads the Next.js app.
  - `https://www.example.com` redirects to `https://example.com`.
  - `https://supabase.example.com` reaches the Supabase gateway.
  - Browser console has no mixed-content errors.
  - Public ports `3000`, `5432`, `8000`, and Studio ports are not exposed.
  - Caddy logs show successful certificate issuance.

Step 45 monitoring and backups:

- App health endpoint: `/api/health`
- CloudWatch agent config: `infra/monitoring/cloudwatch-agent.json`
- Backup scripts: `infra/backups/`
- Restore runbook: `infra/backups/restore-postgres.md`
- Daily Postgres timer examples:
  - `infra/backups/systemd/topopass-postgres-backup.service`
  - `infra/backups/systemd/topopass-postgres-backup.timer`
- Terraform provisions a private encrypted S3 backup bucket with lifecycle
  retention and EC2 instance-role access scoped to the backup prefix.
- Terraform provisions CloudWatch log groups, status/CPU/memory/disk alarms,
  and an SNS alert topic.
- Terraform provisions a monthly AWS Budget with 50% actual, 80% forecasted,
  and 100% actual thresholds.
- `enable_budget_kill_switch` is disabled by default. When enabled, the 100%
  actual budget notification can invoke Lambda to stop only EC2 instances tagged
  `Project = topopass` and `Environment = production`.
- AWS Budgets are not instant and this is not a hard spending cap. It is a
  safety net alongside regular billing checks.
- Required host-only backup env values:

```bash
BACKUP_S3_BUCKET=your-topopass-backup-bucket
BACKUP_S3_PREFIX=topopass
POSTGRES_CONTAINER_NAME=supabase-db
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-on-host-only
BACKUP_WORK_DIR=/srv/topopass-data/backups/postgres
BACKUP_LOG_DIR=/var/log/topopass/backups
STORAGE_SOURCE_DIR=/srv/topopass-data/storage
MAX_BACKUP_AGE_HOURS=36
```

- Manual backup checks:
  - Run `backup-postgres.sh --dry-run`.
  - Run one real `backup-postgres.sh`.
  - Run `verify-latest-backup.sh`.
  - Confirm the S3 object is non-empty.
  - Enable the systemd timer only after a manual backup succeeds.
  - Run a restore drill using `restore-postgres.md`.

## Phase 5 Real London Beta Status

Phase 5 is frozen and signed off as **Real London beta-ready**, not final production-ready. The beta remains behind the default-disabled `NEXT_PUBLIC_REAL_LONDON_BETA` flag, and Marlowe remains the default route-runner map for non-beta users.

Current beta scope:

- Student-facing beta route: `/practice/real-london`
- Included fixture-backed maps: `Real London pilot map` and `Real London pilot map 2`
- Committed fixtures only: `realLondonPilotOverpass.json` and `realLondonPilotTwoOverpass.json`
- Official registered starter exercises with map/exercise version metadata
- Local/test beta feedback storage via `.local/beta-feedback.jsonl`
- Production beta feedback storage via Supabase/PostgREST when configured
- Internal feedback review/export and attempt review/repro export tools, gated by internal env flags

Important exclusions:

- No live Overpass or other live OSM fetches
- No external routing APIs
- No new OSM data in the beta flow
- No final production exposure for normal users
- No changes to route solving, scoring, snapping, legality, OSM conversion, storage semantics, auth, analytics, or deployment behavior

Feature flags and internal gates:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_REAL_LONDON_BETA` | Enables the public Real London beta practice screen | Disabled |
| `BETA_FEEDBACK_REVIEW_ENABLED` | Enables internal feedback review/export | Disabled |
| `BETA_ATTEMPT_REVIEW_ENABLED` | Enables internal beta attempt review/repro export | Disabled |
| `BETA_FEEDBACK_STORAGE=supabase` | Selects production Supabase feedback storage | Unset |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Production feedback storage credentials | Unset |

Validation commands for the Phase 5 beta-ready state:

```powershell
npm.cmd run test:phase5-beta-readiness
npm.cmd run test:public-beta-feedback
npm.cmd run test:map
npm.cmd run lint
npm.cmd run build
```

Known limitations:

- Real London beta coverage is limited to the current committed pilot areas and starter exercises.
- Feedback needs human triage before wider rollout decisions.
- Production admin/auth hardening for internal review tools is deferred.
- Broader device QA, tester onboarding, analytics, and more London areas are Phase 6 work.
- OSM-derived map views must keep OpenStreetMap attribution visible where OSM data is shown.

Detailed Phase 5 implementation history has moved to [docs/phase-5-beta-ready.md](docs/phase-5-beta-ready.md).

Phase 6 Real London map styling work is judged against the Stage 141 acceptance
contract in [docs/phase-6-map-styling-acceptance.md](docs/phase-6-map-styling-acceptance.md).
The current Stage 142 map style audit and tokenisation notes live in
[docs/phase-6-real-london-map-style-audit.md](docs/phase-6-real-london-map-style-audit.md).

## Current Feature Set

- Landing page with private-hire applicant positioning
- Modern public home page with learner CTAs, local-first/account progress copy,
  clear Topographical/SERU separation, and a clean custom practice-overview
  hero visual
- High-resolution homepage practice-overview SVG asset under
  `public/images/home-practice-overview-hero.svg`
- Production Docker support for the Next.js app, with domain/HTTPS routing
  prepared for the app and future self-hosted Supabase gateway
- Root Docker Compose workflow for app-only local/EC2 runs
- Public Topographical Course and SERU Course information pages for logged-out
  visitors
- Signed-out Course dropdown linking to `/topographical`, `/seru`, and
  `/course`
- Public `/course` page explaining the guided TopoPass preparation course
- Public `/demo` page with separate 10-question timed Topographical and SERU
  demo routes
- Monetisation foundation with Free, Plus, and Pro plan definitions
- Free plan status on `/account` with included features and upgrade-coming-soon
  copy
- Pricing preview with safe no-PII upgrade-interest capture and no live payment
  provider
- Light feature-gating placeholders for advanced progress insights and expanded
  content
- Fuller public footer with Prepare, Learn, Account, and Information columns
- Newsletter signup using Supabase `newsletter_signups`; no email provider is
  connected
- Placeholder social icons for Instagram, TikTok, YouTube, Facebook, X/Twitter,
  and LinkedIn
- Public `/about`, `/contact`, `/privacy`, `/terms`, and `/disclaimer` pages
- Contact email: `support@topopass.co.uk`; TopoPass is currently a sole trader
  project
- Expanded Learn section with structured learning paths
- SERU preparation support as a separate learning area, not mixed into
  topographical mock exams
- Practice hub that explains Topographical and SERU-style practice before
  sending learners into separate focused areas
- Dedicated `/practice/topographical` route for topographical topic selection
  and route/map/location practice entry points
- Topic-based practice selector with counts per topic and weak-topic guidance
- Knowledge practice with local saved attempts
- SERU-style practice route with original multiple-choice starter questions,
  explanations, and topic/difficulty filters
- Map-click practice with selected marker feedback and distance scoring
- Route-drawing practice with continuous line drawing, pan/zoom, undo, clear,
  reset, and route scoring
- Focused practice filters for topic and difficulty
- End-of-session practice summaries with wrong-answer review prompts
- Mixed mock exam modes and timed exam simulation
- Progress dashboard with signed-out local analytics and signed-in
  account-scoped Supabase reads when configured
- Progress and account dashboards with question totals, accuracy, topic
  strengths/weaknesses, and recent activity
- Mistake review with retry queue and visual answer review
- Full `/review` answer history for practice and mock attempts with filters
- Review and progress summaries can separate Topographical Skills from SERU
  Preparation where saved answers contain SERU question IDs/topics
- Local data export/import/reset tools for learner progress
- Optional learner account sign-up, log-in, sign-out, and account page
- Missing learner profile rows are repaired automatically for the authenticated
  user; `/account` falls back to auth email, `Not set` display name, and the
  Free plan while profile metadata syncs.
- Signed-in practice/mock completion saves to Supabase account tables
- Authenticated progress reads are scoped by the current Supabase user id
- Basic account progress summary from Supabase records
- Protected prototype admin question managers and validators
- Protected admin publishing controls for Supabase `question_bank_items`
- Admin batch publish/archive/draft review actions for selected questions
- Admin-only learner preview for source-bank and imported question records
- Admin-only JSON import/export tools for `question_bank_items`
- Expanded draft-first production starter seed content and manual question-bank
  seed command
- Canonical learner content topics for `question_bank_items`: London geography,
  major roads and routes, bridges and river crossings, stations and transport
  hubs, hospitals/key public buildings, landmarks and destinations, route
  planning, direction sense, map interpretation, and passenger scenario
  judgement
- Root/admin/account error boundaries and async loading states
- Safe structured logger for production-safe diagnostics
- Phase 3 regression tests for auth, progress persistence, admin protection,
  publishing, import/export, seed safety, and safe logging
- Mock exam map-click and route-planning answers save from the interaction and
  advance with Next instead of requiring a separate Submit step
- Mock exam results show pass/fail feedback, score clarity, question-type and
  topic breakdowns, next-step guidance, and improved answer review metadata
- Public-page SEO/Open Graph/Twitter metadata for Home, Learn, Practice, Mock
  Test, Progress, Resources, and Pricing
- Static social preview asset under `public/social/topopass-social.svg`
- Typed no-op analytics event helper for public CTA, practice-start,
  mock-start, pricing, and sign-up intent events
- Pricing preview page with Free, Plus, and SERU preparation tiers; no
  payment provider is connected
- OpenStreetMap-derived local route map
- Cleanroom generated driver-training atlas review asset, not yet integrated
- Supabase package/helper/schema foundation for Phase 3
- Stage 27 schema-aligned learner progress persistence

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Mapbox GL JS for current map-click demo questions
- OpenStreetMap-derived GeoJSON and generated SVG map data
- Local browser persistence for current progress and mistake review
- Supabase JavaScript client and SSR helper scaffold
- Supabase learner auth page/action scaffold
- Supabase SQL migrations for the Phase 3 backend foundation
- Node.js built-in test runner

## App Routes

| Route | Current purpose |
| --- | --- |
| `/` | Public TopoPass homepage |
| `/course` | Public page explaining how the TopoPass preparation course works |
| `/topographical` | Public Topographical Course information page |
| `/seru` | Public SERU-style preparation course information page |
| `/demo` | Public demo chooser for Topographical and SERU previews |
| `/demo/topographical` | Short timed Topographical demo |
| `/demo/seru` | Short timed SERU-style demo |
| `/about` | Public information page about TopoPass |
| `/contact` | Public contact page with support email and beta business address note |
| `/privacy` | Beta-ready privacy policy placeholder |
| `/terms` | Beta-ready plain-English terms placeholder |
| `/disclaimer` | Independent-learning and no-affiliation disclaimer |
| `/learn` | Expanded learning hub, study path, and SERU preparation support notes |
| `/practice` | Practice hub for choosing Topographical or SERU-style practice |
| `/practice/topographical` | Topographical practice hub with topic selector and question-type entry points |
| `/practice/knowledge` | Knowledge question practice |
| `/practice/map-click` | Map-click location practice |
| `/practice/routes` | Route-drawing practice |
| `/practice/seru` | Separate SERU-style private hire knowledge practice |
| `/mock-test` | Mock exam mode selection and exam flow |
| `/progress` | Local progress dashboard |
| `/progress/mistakes` | Mistake review and retry flow |
| `/auth/sign-up` | Optional learner account creation |
| `/auth/log-in` | Optional learner account login |
| `/auth/callback` | Supabase email confirmation/session exchange callback |
| `/account` | Protected learner account/profile page |
| `/route-demo` | Route-drawing development/demo flow |
| `/demo` | Short public preview; full learning happens in `/practice` |
| `/login` | Legacy placeholder route; active auth is under `/auth/log-in` |
| `/register` | Legacy placeholder route; active sign-up is under `/auth/sign-up` |
| `/dashboard` | Local dashboard shell |
| `/admin` | Prototype admin overview and validation summary |
| `/admin/questions` | Combined static question inventory |
| `/admin/questions/knowledge` | Knowledge question draft manager |
| `/admin/questions/map-click` | Map-click question draft manager and preview |
| `/admin/questions/route` | Route question draft manager and preview |
| `/admin/questions/new` | Question-type creation entry point |
| `/admin/questions/[id]` | Question inspection and manager routing |
| `/admin/questions/import-export` | Admin-only question_bank_items JSON import/export |
| `/admin/questions/routes` | Compatibility route for route question manager |
| `/resources` | Useful official, map-study, SERU-style support, and study resource links |
| `/pricing` | Honest pre-launch pricing preview; payments are not implemented |
| `/results/[attemptId]` | Legacy result route; database loading is not active yet |
| `/review` | Full answer review history with filters for subject, type, result, source, date, and sort order |

## Question Types

### Knowledge

Multiple-choice questions are stored in `lib/knowledgeQuestions.ts`. Practice
and mock-exam scoring use exact answer matching.

### SERU-Style Knowledge

SERU-style starter questions are stored separately in `lib/seruQuestions.ts`.
They use the same multiple-choice practice component and learner account, but
they are not imported into the topographical mock exam bank.

### Map Click

Location questions are stored in `lib/mapClickQuestions.ts`. Mapbox captures a
clicked coordinate and `lib/distance.ts` calculates the distance from the
configured target. Each question defines its own tolerance in metres.

### Route Drawing

Route questions are stored in `src/data/routeQuestions.ts`. The learner draws
over local map assets generated from real OSM GeoJSON. Route scoring lives in
`lib/routeScoring.ts`.

## Mock Exam Behaviour

The mock exam currently supports:

- Practice mock mode
- Exam simulation mode
- Weak areas mode
- Mistakes mode
- Configurable timer and pass mark
- Question navigator and unanswered-state tracking
- Active attempt restoration using browser `localStorage`
- Answer preservation while moving between questions
- Automatic submission when time expires
- Overall and per-question-type results
- In-session review of every answer

Configuration lives in `lib/mockExamConfig.ts` and mode construction lives in
`lib/mockExamModeBuilder.ts`.

## Progress And Review

Current learner progress remains local-first for signed-out users and
account-scoped for signed-in users when Supabase is configured. It supports:

- Saved practice attempts
- Saved mock attempts
- Progress dashboard metrics
- Weak area analysis
- Practice recommendations
- Mistake aggregation
- Reviewed/unreviewed mistake state
- Retry queues
- Full answer history review
- Local progress export, import, and reset for browser-local data

This keeps the app usable without accounts. When a learner is signed in, new
practice and mock completions save locally first and also save to the Stage 27
Supabase tables. Signed-in progress, mistake review, and answer review reads
are scoped to the authenticated Supabase user id; signed-out review and
progress use only browser-local history.

`/progress/mistakes` is the filtered mistakes view for incorrect answers.
`/review` is the full answer history view and includes both correct and
incorrect practice/mock answers. Review filters include subject/category,
question type, result, source, date range, and newest/oldest sort order.

## Admin Tools

The admin area validates and previews all three question types. It is protected
by Supabase learner authentication plus the `profiles.role = 'admin'` role. It
supports browser-local create, edit, activate/deactivate, preview, reset, and
export workflows for knowledge, map-click, and route questions.

Admin edits are prototype drafts saved to browser `localStorage`. They do not
update source files or learner-facing question banks automatically.

Stage 31 adds Supabase publishing controls to the combined question inventory.
Admins can save a source-bank question into `question_bank_items` as a draft,
publish it, or archive it. Database-backed learner question reads use only
`status = 'published'`; draft and archived rows are hidden by repository
filtering and Row Level Security. Non-admin learners cannot access admin pages
or manage question status.

Stage 32 adds `/admin/questions/import-export`. Admins can export all
`question_bank_items` rows or filter exports to published, draft, or archived
rows. Admins can import pasted JSON or a JSON file, preview validation results,
then either create new records only or upsert matching IDs. Import writes only
to `question_bank_items`, defaults missing status values to `draft`, and rejects
old table-shaped payloads rather than silently mapping them.

Stage 33 adds production seed support. Stage 36 expands the starter seed file at
`supabase/seed/question_bank_items.json` into a larger draft-first content set
covering knowledge, map-click, route-planning, direction sense, landmarks,
stations, hospitals, bridges, roads, and passenger scenario judgement. It uses
the same Stage 32 import format and starts all records as `draft` so admins must
review and publish content deliberately.

The admin question inventory now shows source-bank and Supabase-only
`question_bank_items` records together, with counts and filters for publishing
status, topic/category, and difficulty. Stage 37 adds batch status controls for
selected questions and a review/preview detail page that shows how a question
will read to learners without publishing it.

To make a browser-local admin draft permanent today:

1. Export the relevant JSON bank.
2. Review and validate the exported records.
3. Deliberately add approved data to the appropriate TypeScript question bank.
4. Run lint, tests, and build.

Production moderation remains planned for a later phase.

## Question Bank JSON Format

Question bank exports use this envelope:

```json
{
  "format": "topopass-question-bank-items",
  "version": 1,
  "exportedAt": "2026-06-24T00:00:00.000Z",
  "statusFilter": "all",
  "question_bank_items": [
    {
      "id": "knowledge-example",
      "question_type": "knowledge",
      "status": "draft",
      "difficulty": "easy",
      "category": "Map interpretation",
      "prompt": "Example question?",
      "explanation": "Example explanation.",
      "tip": "Example tip.",
      "tags": ["Map interpretation"],
      "payload": {
        "options": ["North", "South"],
        "correctAnswer": "North"
      },
      "version": 1,
      "source": "admin-import"
    }
  ]
}
```

Imports also accept a raw array of `question_bank_items` records. The importer
validates required fields, canonical topic/category values, `easy`/`medium`/
`hard` difficulty, `knowledge` options/answer payloads, `map-click`
coordinate/radius payloads, and `route-drawing` endpoint/map-bounds payloads.
Only `draft`, `published`, and `archived` are accepted statuses; missing status
defaults to `draft`, and missing difficulty defaults to `medium`.

Canonical Stage 36 topics are:

- `London geography`
- `Major roads and routes`
- `Bridges and river crossings`
- `Stations and transport hubs`
- `Hospitals and key public buildings`
- `Landmarks and destinations`
- `Route planning`
- `Direction sense`
- `Map interpretation`
- `Passenger scenario judgement`

## Production Seed Data

Production starter content is stored here:

```txt
supabase/seed/question_bank_items.json
```

Validate and import it manually with:

```powershell
npm.cmd run seed:questions
```

The seed command:

- reads `supabase/seed/question_bank_items.json`
- validates with the same Stage 32 import helper
- signs in with a normal Supabase admin account
- upserts only `question_bank_items`
- refuses to run when required environment variables are missing
- does not touch learner progress tables

Required local environment variables for the seed command:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SEED_ADMIN_EMAIL=
SUPABASE_SEED_ADMIN_PASSWORD=
```

`SUPABASE_SEED_ADMIN_EMAIL` must belong to an authenticated user whose
`profiles.role` is `admin`. Do not commit real seed credentials.

Seeded draft questions are visible in `/admin/questions` and hidden from
learner-safe database reads. Review seeded content in admin, use the topic,
status, and difficulty filters to organise the larger content set, then publish
only records that are ready for learners.

## Error Handling And Logging

Stage 34 adds app-level resilience for production use:

- Root error and not-found states for unexpected app errors and missing routes
- Admin, account, and import/export error boundaries
- Admin, account, and import/export loading states for async auth/Supabase work
- Safe generic user-facing messages for auth, account, admin publishing,
  import, and export failures
- A shared logger in `lib/logging/logger.ts`

The logger writes structured JSON in production and console-readable output in
development. Log context is sanitized before output. It must not be used for
passwords, tokens, cookies, authorization headers, service-role keys, anon keys,
private keys, raw request bodies, full imported JSON payloads, full user
objects, or learner answers. Admin import/export logs counts and safe status
metadata, not imported question content.

## Supabase Foundation

The project now includes Supabase dependencies and helper scaffolding for Phase
3:

```txt
lib/supabase/browser.ts
lib/supabase/server.ts
lib/supabase/config.ts
lib/supabase/types.ts
lib/auth/session.ts
lib/auth/admin.ts
lib/auth/roles.ts
lib/db/practiceAttemptRepository.ts
lib/db/mockAttemptRepository.ts
lib/db/progressRepository.ts
```

The current Phase 3 schema foundation is:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_question_publishing_workflow.sql
```

It defines:

- `profiles`
- `practice_attempts`
- `question_attempts`
- `mock_attempts`
- `mock_question_attempts`
- `saved_progress`
- `question_bank_items`

Row Level Security is enabled for these tables. User-owned progress tables are
scoped to `auth.uid()`. Signed-in practice saves use `practice_attempts` plus
`question_attempts`; signed-in mock saves use `mock_attempts` plus
`mock_question_attempts`. Admin page access uses `profiles.role`; database
admin/content policies use a profile-backed admin role helper for
`question_bank_items` management. Question publishing statuses are `draft`,
`published`, and `archived`, with new admin-created database rows defaulting to
`draft`.

An older persistence-foundation migration is still present for project history.
Phase 3 work should use the Phase 3 roadmap and current migration strategy.

## Environment Variables

Copy `.env.example` to `.env.local` and provide values as needed:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_MAPBOX_TOKEN` is required for current Mapbox map-click pages. For
production Docker images, it must be supplied to the GitHub Actions build as a
repository variable so the browser bundle is built with Mapbox enabled; adding
it only to the EC2 runtime dotenv file is not enough for already-built client
chunks.
Supabase public URL and anon key are optional until Phase 3 stages wire database
behaviour into learner flows. They are required to use account pages and
account-backed progress saving. `NEXT_PUBLIC_SITE_URL` is optional and is used
to resolve canonical/social preview metadata. Do not commit real secrets.

## Map Assets

Current learner route practice uses generated local map assets derived from:

```txt
public/maps/kings-cross-euston/osm-raw.geojson
```

Regenerate the current route-practice map and graph only when source map data or
map scripts change:

```powershell
npm.cmd run map:build:kings-cross-euston
```

The cleanroom driver-training atlas review asset can be regenerated with:

```powershell
npm.cmd run map:render:driver-training-atlas
```

That generated atlas asset is saved under `public/maps/generated/` for review
and is not integrated into the live app UI yet.

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

For a production-mode local check:

```powershell
npm.cmd run build
npm.cmd run start
```

## Test And Verify

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

The test suite covers route scoring, map helpers, mock exam logic, admin
validation, local persistence, Supabase schema/auth/progress/admin/publishing
and import/export/seed validation, safe production logging, progress analytics,
recommendations, mistake review, and visual review helpers.

## Stage 35.6 Account Isolation And Review QA Status

Stage 35.6 is a verification and improvement pass. It did not add database
tables, columns, policies, or migrations.

Account data isolation result:

- Existing Supabase RLS already isolates `practice_attempts`,
  `question_attempts`, `mock_attempts`, `mock_question_attempts`, and
  `saved_progress` with `user_id = auth.uid()`.
- Repository reads were tightened so authenticated learners query progress by
  the authenticated Supabase user id instead of relying on broad reads or
  signed-out local history.
- Signed-out users still use browser-local progress and review history.
- Admin question tooling remains server-side protected and does not read learner
  progress tables.

Review and exam UX result:

- `/review` now renders full answer history instead of the old placeholder.
- Review history includes practice and mock exam answers where saved.
- Review filters cover subject/category, question type, correct/incorrect,
  source, date range, and newest/oldest sorting.
- `/progress/mistakes` remains the mistakes-only view.
- Mock exam map-click and route-planning questions now save from the map/route
  interaction and use Next to continue, without a second Submit button in the
  question body.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Result for this Stage 35.6 pass: all three commands passed.

## Stage 36 Content Readiness QA Status

Stage 36 expands content and organisation without adding monetisation,
payments, subscriptions, or launch marketing.

Content result:

- `supabase/seed/question_bank_items.json` now contains a larger draft-first
  starter set across knowledge, map-click, and route-drawing question types.
- New seed records use canonical `category` topics and `easy`/`medium`/`hard`
  difficulty values.
- Existing static question-bank categories now align with the same canonical
  topic structure.
- Import validation rejects invalid topics, invalid difficulty values, invalid
  statuses, old table-shaped payloads, and malformed question payloads.
- Learner-safe question reads still filter Supabase content to
  `status = 'published'`.

Admin result:

- `/admin/questions` shows source-bank and Supabase-only `question_bank_items`
  records together.
- Admin inventory includes counts and filters for status, topic/category, and
  difficulty.
- `/admin/questions/import-export` previews topic and difficulty metadata before
  commit.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 36 pass: all commands passed.

## Stage 37 Learner And Admin Review Polish QA Status

Stage 37 improves learner usefulness and admin review workflow without adding a
new schema migration or changing signed-out local progress behaviour.

Learner result:

- `/practice` now includes topic-based entry points with available question
  counts for knowledge, map-click, and route sessions.
- Saved local/account-synced answer history is used on-device to highlight weak
  topics where previous mistakes exist.
- Knowledge, map-click, and route practice pages accept `topic` and
  `difficulty` filters.
- Practice sessions show clearer intros, empty states, answer feedback, and
  end-of-session summaries.
- Current-session wrong answers are shown with learner answer, accepted answer,
  and focused feedback.
- Explanation panels now separate the reason, accepted area, route guidance, and
  learning tip for easier reading on mobile.

Admin result:

- `/admin/questions` supports selecting multiple rows and batch moving selected
  records to `published`, `archived`, or `draft`.
- Batch actions reuse the server-side admin check and write only through the
  `question_bank_items` repository path.
- `/admin/questions/[id]` now includes an admin-only learner preview for
  knowledge, map-click, and route questions.
- Database-only imported questions can be opened for review/preview from the
  inventory.
- Import validation UI gives clearer record/field-level guidance without
  logging raw payloads.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 37 pass: all commands passed.

## Stage 38 Progress Dashboard, Mock Exam, And Home UI QA Status

Stage 38 improves learner-facing polish without adding a schema migration or
changing the signed-out local progress fallback.

Home page result:

- The public home page now has a stronger learner-focused hero, primary practice
  CTA, secondary mock/progress CTAs, and a real generated map preview asset.
- Map-click, route drawing, and knowledge practice are surfaced directly from
  the map-learning section.
- Public copy explains local practice without sign-in and account-backed
  progress for signed-in learners.
- Admin-only features are not exposed on the public home page.

Dashboard result:

- `/progress` now clearly labels whether the current view is browser-local or
  account-backed Supabase progress.
- The dashboard shows total questions attempted, correct answers, accuracy,
  mock exams completed, topic strengths/weaknesses, and recent saved answers.
- Topic percentages are highlighted only when there are enough saved answers;
  low-data topics remain marked as developing.
- `/account` now includes account-backed accuracy, topic snapshot, and recent
  activity for signed-in learners.

Mock exam result:

- Mock exam results now show clearer pass/fail wording, score details,
  question-type breakdown, topic breakdown, and next-step recommendations.
- The mock review screen shows each question with learner answer, accepted
  answer, correctness, topic, difficulty, score, and explanation where
  available.
- Older/incomplete review metadata has a fallback message instead of crashing.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 38 pass: lint, tests, and production build passed.

## Stage 39 Launch Readiness And Conversion QA Status

Stage 39 improves public launch readiness without adding payments, schema
migrations, a SERU exam engine, or a third-party analytics provider.

Public UX result:

- The home page now has a clearer conversion hero for TfL private hire learners,
  with CTAs for free practice, topographical mock exams, and account creation.
- The previous map screenshot-style hero has been replaced by a lightweight
  custom learning-map visual built in React/SVG/CSS.
- Home sections now cover topographical map skills, SERU preparation support,
  mock exams, progress tracking, how TopoPass works, why learners use it,
  pricing preview, and a final CTA.
- Public copy confirms TopoPass is independent and not affiliated with or
  endorsed by Transport for London.

SERU positioning result:

- SERU is presented as a separate product area/category and now has starter
  SERU-style practice.
- SERU copy covers safety, equality, accessibility, customer service,
  safeguarding, licensing rules, driver responsibilities, complaints, lost
  property, and regulatory awareness.
- Current topographical mock exams remain topographical-only; SERU questions are
  not mixed into the existing mock exam engine.
- Future SERU work can add a dedicated SERU mock exam and deeper
  exam-family-separated analytics.

Pricing and launch result:

- `/pricing` now shows Free, Plus, and SERU preparation tiers.
- Paid plans are marked as coming later, and payment processing is not live.
- Pricing copy states that one account is planned to eventually include both
  Topographical and SERU preparation support.
- No Stripe or other payment provider was added.

SEO, social, and analytics result:

- Home, Learn, Practice, Mock Test, Progress, Resources, and Pricing now export
  page-specific metadata using the shared metadata helper.
- A lightweight social preview SVG exists at
  `public/social/topopass-social.svg`.
- `lib/analytics/events.ts` defines typed event names and property sanitisation
  for CTA, practice-start, mock-start, pricing, and sign-up intent events.
- Analytics is a safe no-op unless a provider is deliberately connected later.
- Analytics sanitisation removes sensitive property keys such as email,
  password, token, session, user, answer, cookie, payload, and raw payload
  fields.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 39 pass: lint, tests, and production build passed.

## Stage 39.5 SERU Practice Foundation QA Status

Stage 39.5 turns the Stage 39 SERU positioning into a small separate learner
practice foundation without adding a SERU mock exam, payment provider, or schema
migration.

SERU practice result:

- `/practice/seru` provides a separate SERU-style starter practice area.
- `lib/seruQuestions.ts` contains 24 original multiple-choice SERU-style
  questions with explanations, tips, difficulty, and topic metadata.
- SERU topics cover driver licensing and responsibilities, passenger safety,
  safeguarding, equality and accessibility, customer service, complaints and
  professionalism, private hire regulations, journey planning and conduct, lost
  property, and road safety awareness.
- SERU questions use the existing knowledge practice component and local-first
  progress saving, with signed-in Supabase progress saving preserved through
  the existing practice-attempt repository.
- Review history and dashboard summaries can identify SERU answers from SERU
  question IDs and topics.

Separation result:

- Topographical mock exams still select from `lib/knowledgeQuestions.ts`,
  `lib/mapClickQuestions.ts`, and route questions only.
- SERU starter questions are not imported into `knowledgeMockQuestionBank` or
  `mockQuestionBank`.
- The public homepage, practice page, mock-test intro, resources page, pricing
  page, and Learn content now point to SERU as a separate preparation area.
- Admin question inventory includes SERU source-bank records and validates SERU
  topics for import/export through `question_bank_items`.
- No Supabase schema migration was added for this stage.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 39.5 pass: lint, tests, and production build passed.

## Stage 39.6 Practice Journey And Navigation QA Status

Stage 39.6 clarifies the learner journey without adding payments, schema
migrations, or new exam-family mixing.

Practice result:

- `/practice` is now a learner hub that explains practice before asking
  learners to choose Topographical or SERU-style practice.
- `/practice/topographical` is the dedicated topographical practice area with
  purpose copy, topographical action buttons, topic cards, question-type entry
  points, and less stressful weak-topic guidance.
- `/practice/seru` has matching intro copy, a clean SERU-style illustration,
  topic cards, a start button, mistake-review link, and a clear "SERU mock
  coming soon" state.
- Topographical and SERU-style practice remain separate. SERU-style questions
  are still not included in topographical mock exams.

Demo and navigation result:

- `/demo` is clarified as a short public preview, not the full learning mode.
- Demo currently remains a small map-click preview rather than a full 3-5
  question guided sample. A fuller Demo flow is intentionally left for a later
  pass.
- Signed-out navigation now focuses on Topographical, SERU, Demo, Resources,
  Pricing, Sign in, and Start practising.
- Signed-in learner navigation focuses on Dashboard, Practice, Mock Test,
  Review, Progress, Account, and Sign out.
- The large homepage practice-overview image is now a project asset at
  `public/images/home-practice-overview-hero.svg`.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 39.6 pass: lint, tests, and production build passed.

## Stage 39.7 Public Assessment Pages QA Status

Stage 39.7 improves the logged-out public experience without adding payments,
schema migrations, official-question content, or new learner-data behaviour.

Public assessment result:

- `/course` explains the guided TopoPass preparation course, the learner
  journey, included course areas, product-preview cards, focused revision, and
  independent-learning positioning.
- `/topographical` explains the Topographical Course, map reading,
  route planning, direction sense, key London locations, mistake review, and how
  TopoPass helps learners prepare.
- `/seru` explains SERU-style preparation, Safety, Equality and Regulatory
  Understanding topics, safeguarding context, original SERU-style practice, and
  how TopoPass helps learners revise.
- Both pages use the public `Navbar` and `Footer`; they do not use `AppShell`
  or the learner sidebar.
- Both pages include independent/non-affiliation wording and avoid claims that
  TopoPass is official, guarantees a pass, or provides official TfL questions.

Navigation result:

- Signed-out visitors see a Course dropdown with Topographical Course, SERU
  Course, and How the course works, plus Demo, Resources, Pricing, Sign in, and
  Start practising.
- Signed-in learners still see Dashboard, Practice, Mock Test, Review,
  Progress, Account, and Sign out.
- Demo remains separate from Course navigation and offers short public
  Topographical and SERU previews, not the full Practice area.
- Each demo is timed, limited to 10 questions, shows feedback, and ends with a
  short result summary plus full-practice/account CTAs.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 39.7 pass: lint, tests, and production build passed.

## Stage 40 Monetisation Foundation QA Status

Stage 40 prepares TopoPass for beta users and future paid upgrades without
activating billing.

Plan structure:

- `free` is the default for signed-out and signed-in learners.
- `plus` and `pro` are coming-soon placeholders only.
- Current free access remains available; existing practice, mock, progress,
  review, account, and admin flows are not hidden behind unfinished payment
  logic.

Pricing and upgrade intent:

- `/pricing` shows Free, Plus, and Pro plan cards.
- The Free CTA continues learners into practice.
- Plus and Pro CTAs register upgrade interest on the page without collecting
  email, taking payment, or calling a payment provider.
- The pricing page states that one TopoPass account is planned to support both
  Topographical and SERU-style preparation while keeping the learning areas
  separate.

Account plan display:

- `/account` shows the current Free plan, included features, upgrade-coming-soon
  items, and a link back to pricing.
- Account progress, signed-out local progress, and signed-in Supabase progress
  remain unchanged.

Safety result:

- No payment provider, checkout, Stripe integration, subscription billing, or
  paid-plan schema migration was added.
- No personal data is collected for upgrade interest.
- Analytics events remain allow-listed and no-op unless a safe provider is
  supplied.
- Disclaimers now state that TopoPass is independent, practice content is for
  preparation only, SERU-style questions are original learning questions, and
  learners should refer to official TfL guidance where appropriate.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 40 pass: lint, tests, and production build passed.

## Stage 40 Footer, Newsletter, And Info Pages QA Status

The additional Stage 40 public trust pass adds launch-supporting surfaces
without adding email delivery, payments, or fake company details.

Footer result:

- The shared footer now includes Prepare, Learn, Account, and Information link
  columns.
- Footer bottom copy uses `Â© 2026 TopoPass. All rights reserved.`
- Footer disclaimer states that TopoPass is independent, not affiliated with or
  endorsed by TfL, and that SERU-style questions are original learning
  questions, not official TfL questions.
- Contact email is `support@topopass.co.uk`.
- TopoPass is presented as a sole trader project; no company number, registered
  office, fake certification, or fake address was added.

Newsletter result:

- Newsletter signup is available in the footer for signed-out and signed-in
  visitors.
- A Supabase migration was added for `newsletter_signups`.
- Stored fields are email, source, consent text, consent version, and timestamp.
- Duplicate emails are handled with a friendly already-signed-up message.
- No Mailchimp, Resend, SendGrid, ConvertKit, SMTP provider, or confirmation
  email was added.
- Analytics events are no-op/allow-listed and do not include email addresses.

Social and information pages result:

- Footer social icons for Instagram, TikTok, YouTube, Facebook, X/Twitter, and
  LinkedIn are placeholders only and marked as coming soon.
- `/about`, `/contact`, `/privacy`, `/terms`, and `/disclaimer` were added as
  useful beta-ready placeholder pages.
- Legal/information pages should still be reviewed before full public launch.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this additional Stage 40 pass: lint, tests, and production build
passed.

## Phase 4 Stage 40 Low-Cost AWS DevOps Prep QA Status

Phase 4 begins with deployment preparation only. This pass prepared the app for
a single EC2 Docker deployment while preserving the existing Supabase-backed
auth, progress, admin roles, publishing, import/export, and newsletter signup
logic.

Deployment prep result:

- `Dockerfile` builds a production Next.js standalone image.
- `.dockerignore` keeps local env files, build outputs, `node_modules`, and
  local workspace artifacts out of Docker build context.
- `.env.production.example` documents placeholder production runtime variables
  only.
- `deploy/docker-compose.prod.yml` runs the app service on
  `127.0.0.1:3000` with a restart policy and EC2 runtime env file reference.
- `docs/aws-ec2-devops-deployment.md` documents GitHub Actions, Docker, ECR,
  EC2, Docker Compose, Supabase routing, Route 53, Caddy, CloudWatch, IAM, EBS,
  and optional S3 backup considerations.
- `next.config.mjs` now enables standalone output for container runtime.

Safety result:

- No real production secrets were added.
- No `.env` or `.env.production` file was added.
- No self-hosted Supabase containers were added.
- No Terraform, AWS state, or production credentials were added.
- No app features, UI, signed-out progress, signed-in Supabase progress, or
  Topographical/SERU separation were changed.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 --build-arg NEXT_PUBLIC_SUPABASE_URL= --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY= --build-arg NEXT_PUBLIC_MAPBOX_TOKEN= -t topopass-web:stage40 .
git diff --cached --check
```

Result for this Phase 4 Stage 40 deployment-prep pass: lint, tests,
production build, and Docker image build passed.

## Stage 41 Dockerise Application QA Status

Stage 41 turns the deployment-prep scaffold into a practical app-only Docker
workflow. It does not add self-hosted Supabase, product feature changes, UI
changes, AWS deployment, or production secrets.

Dockerisation result:

- The production `Dockerfile` uses a multi-stage build and Next.js standalone
  output.
- The runtime container copies only the standalone app output, public assets,
  and static build assets.
- The runtime container runs as the non-root `nextjs` user and exposes port
  `3000`.
- `.dockerignore` excludes local dependencies, build outputs, env files, git
  files, logs, local workspace folders, and generated artifacts.
- `docker-compose.yml` builds and runs the app service as `topopass-app`,
  loads `.env.docker`, maps host port `3000` to the container by default, uses
  `restart: unless-stopped`, and includes a healthcheck.
- `.env.docker.example` documents placeholder Supabase and runtime
  values only.
- `package.json` includes `docker:build`, `docker:up`, `docker:down`, and
  `docker:logs` helper scripts.

Local run commands:

```powershell
Copy-Item .env.docker.example .env.docker
npm.cmd run docker:up
npm.cmd run docker:logs
npm.cmd run docker:down
```

If local port `3000` is already in use, set a shell override before starting
Compose:

```powershell
$env:TOPOPASS_HOST_PORT = "3001"
npm.cmd run docker:up
```

EC2 run outline:

1. Copy or pull the repository onto the EC2 host.
2. Create the runtime env file on the server only.
3. Fill production Supabase public URL and anon key on the server.
4. Run `docker compose up -d --build`.
5. Check logs with `docker compose logs -f topopass-app`.
6. For production domain routing, use `deploy/docker-compose.prod.yml` with
   the Step 44 Caddy configuration.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 --build-arg NEXT_PUBLIC_SUPABASE_URL= --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY= --build-arg NEXT_PUBLIC_MAPBOX_TOKEN= -t topopass-web:stage41 .
docker compose up -d --build
docker compose ps
docker compose logs --tail 80 topopass-app
docker compose down
git diff --cached --check
```

Result for this Stage 41 pass: lint, tests, production build, Docker image
build, Docker Compose startup, container logs, HTTP 200 response, and Compose
shutdown passed. Local Compose was verified with `TOPOPASS_HOST_PORT=3001`
because port `3000` was already occupied on the development machine.

## Step 42 GitHub Actions ECR Publishing QA Status

Step 42 adds image publishing only. It does not deploy to EC2, add ECS/Fargate,
add an ALB, add Terraform, provision servers, or change Supabase hosting.

Workflow result:

- `.github/workflows/docker-publish-ecr.yml` runs on push to `main` and manual
  `workflow_dispatch`.
- The workflow uses `contents: read` and `id-token: write` permissions only.
- AWS credentials are configured through `aws-actions/configure-aws-credentials`
  using GitHub OIDC role assumption.
- Amazon ECR login uses `aws-actions/amazon-ecr-login`.
- The existing Dockerfile is built and tagged with both the Git commit SHA and
  `latest`.
- Both tags are pushed to the configured private ECR repository.
- No EC2 deploy commands, SSH, SSM, ECS/Fargate, ALB, Terraform, or server
  provisioning logic was added.

Required GitHub/AWS configuration:

- `AWS_REGION`: GitHub repository variable.
- `AWS_ROLE_TO_ASSUME`: GitHub repository variable containing the OIDC role ARN.
- `ECR_REPOSITORY`: GitHub repository variable containing the private ECR
  repository name.
- `NEXT_PUBLIC_SITE_URL`: optional GitHub repository variable.
- `NEXT_PUBLIC_SUPABASE_URL`: required GitHub repository variable.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: required GitHub repository variable for map-click
  pages.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: required GitHub repository secret for
  production auth pages.

Verification checklist:

- Confirm the private ECR repository exists.
- Confirm the OIDC role trust policy is scoped to the GitHub repository.
- Confirm the role has only the ECR permissions needed to push images.
- Confirm the workflow runs successfully from `workflow_dispatch`.
- Confirm the ECR repository receives both `latest` and the commit SHA tag.
- Confirm no AWS access keys, Supabase service-role keys, `.env` files,
  `node_modules`, `.next`, or build outputs are committed.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Step 42 pass: lint, tests, production build, and cached diff
checks passed locally. ECR push must be tested from GitHub after the required
repository variables and OIDC role are configured.

## Stage 43 Terraform EC2 Infrastructure QA Status

Stage 43 provisions the EC2 production deployment target using Terraform. It
creates the EC2 host, persistent EBS data volume, Elastic IP, optional DNS
record, SSM access, ECR pull permissions, CloudWatch support, and snapshot
backups. Secrets are intentionally excluded from Terraform.

Infrastructure result:

- `infra/terraform` contains the production EC2 root module.
- Terraform can create a small VPC and public subnet by default, or use an
  existing VPC/subnet when supplied.
- The EC2 host uses Ubuntu 24.04 LTS.
- `user_data` installs Docker, Docker Compose plugin, AWS CLI, and CloudWatch
  agent support.
- `user_data` prepares `/srv/topopass`, `/srv/topopass-data`,
  `/srv/topopass-data/postgres`, `/srv/topopass-data/storage`, and
  `/srv/topopass-data/backups`.
- The persistent data EBS volume is mounted at `/srv/topopass-data` and added
  to `/etc/fstab`.
- SSH ingress is disabled by default; SSM Session Manager is preferred.
- Daily EBS snapshots are configured through Data Lifecycle Manager.
- Production containers are not started automatically.

Security result:

- No `.env.production`, Supabase secrets, database passwords, JWT secrets, API
  keys, or application secrets were added.
- `terraform.tfvars.example` contains placeholders only.
- `.gitignore` excludes Terraform state and real `.tfvars` files.
- Terraform state is intended to remain free of application secrets.

Verification commands for this pass:

```powershell
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 43 pass: Terraform format, init, and validate passed.
Terraform plan was attempted but could not complete because the local AWS
credentials returned `InvalidClientTokenId`; rerun plan with valid AWS
credentials before apply. App lint, tests, and production build passed.

## Step 44 Domain HTTPS Reverse Proxy QA Status

Step 44 adds production domain routing, HTTPS termination, and reverse proxy
support with Caddy. It does not deploy AWS resources, commit real domains,
commit secrets, expose Supabase Studio, or change application features.

Infrastructure result:

- Terraform can create Route 53 A records for the apex app domain, `www`, and
  the Supabase gateway subdomain when `enable_route53_records = true`.
- `route53_zone_id` can be supplied directly, or Terraform can look up the
  hosted zone by `route53_zone_name` or `domain_name`.
- Outputs include `app_url`, `www_url`, and `supabase_url`.
- Security group rules still expose only HTTP/HTTPS publicly by default.
- SSH remains disabled unless `ssh_cidr_blocks` is set.

Docker/Caddy result:

- `deploy/Caddyfile` supports current IP-only HTTP smoke testing plus future
  automatic HTTPS, app proxying, `www`
  redirect, security headers, and Supabase gateway proxying.
- `deploy/docker-compose.prod.yml` now includes Caddy with persistent
  `caddy_data` and `caddy_config` volumes.
- Caddy is the only production service publishing port `80` during the Step 48A
  temporary public-IP smoke test. Port `443` is closed/reserved for later
  domain/HTTPS setup.
- The Next.js app is internal as `app:3000`.
- The future Supabase gateway route expects an internal `kong:8000` service.
- Supabase Studio and Postgres are not exposed publicly.

Environment result:

- `.env.production.example` documents placeholder future domain variables, but
  the active Step 48A production proxy env uses only `APP_DOMAIN=:80` and
  `ACME_EMAIL`.
- All values are placeholders. No real domain, certificate, password, database
  secret, JWT secret, Supabase service-role key, or private key was added.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
docker compose -f deploy/docker-compose.prod.yml config
git diff --check
```

Manual production checks still required after AWS/DNS deployment:

- Confirm Route 53 records point to the EC2 Elastic IP.
- Confirm `http://example.com` redirects to `https://example.com`.
- Confirm `https://example.com` loads the Next.js app.
- Confirm `https://www.example.com` redirects to `https://example.com`.
- Confirm `https://supabase.example.com` reaches the Supabase gateway.
- Confirm public scans do not show app, Postgres, Kong, or Studio ports.
- Confirm Caddy logs show successful certificate issuance.
- Confirm auth/progress features use the HTTPS Supabase gateway URL.

## Step 45 Monitoring And Backups QA Status

Step 45 adds lean production monitoring and backup support for the EC2 Docker
Compose deployment. It does not add a paid observability platform, commit real
secrets, upload env files, or change learner/admin product behaviour.

Health and Compose result:

- `/api/health` returns minimal JSON with `ok`, `service`, and `timestamp`.
- The endpoint does not read or expose env vars, Supabase keys, database
  connection strings, or secrets.
- Production Compose checks the app through `/api/health`.
- Caddy has a lightweight config validation healthcheck.
- Caddy logs are written to a host-mounted log directory for CloudWatch pickup.
- Postgres health should use `pg_isready` when the self-hosted Supabase
  Postgres service is added; no public Postgres port is introduced here.

Backup result:

- `infra/backups/backup-postgres.sh` creates custom-format `pg_dump -Fc`
  archives from the running Postgres container and uploads them to S3.
- `infra/backups/backup-storage.sh` optionally archives mounted Supabase
  Storage objects separately.
- `infra/backups/verify-latest-backup.sh` checks that the latest S3 backup
  exists, is non-empty, and is recent.
- `infra/backups/systemd/` contains a daily 02:30 Postgres backup service and
  timer example, not enabled automatically.
- `infra/backups/restore-postgres.md` documents listing, downloading,
  restoring, verifying, and drilling a restore.

Terraform monitoring result:

- S3 backup bucket includes public access block, server-side encryption,
  versioning, lifecycle expiration, and EC2 role access scoped to the backup
  prefix.
- CloudWatch log groups have explicit retention.
- CloudWatch alarms cover EC2 status checks, CPU, memory, and disk.
- SNS alert topic is created with optional `alert_email` subscription.
- DLM EBS snapshots remain configured, but logical Postgres backups are the
  primary restore path.

Security result:

- No `.env`, real S3 bucket, database password, Supabase service-role key, AWS
  credential, backup file, dump file, tar archive, or certificate was added.
- Backup scripts do not echo `POSTGRES_PASSWORD`.
- `.gitignore` excludes local backup artifacts such as `.dump`, `.sql.gz`,
  `.tar`, and `.tar.gz` files.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
docker compose -f deploy/docker-compose.prod.yml config
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
git diff --cached --check
```

Manual production checks still required:

- Confirm CloudWatch agent starts on the EC2 host.
- Confirm log groups receive user-data, syslog, backup, Caddy, and deploy logs.
- Confirm SNS email subscription if `alert_email` is set.
- Confirm AWS Budget email subscription if `budget_alert_email` is set.
- Test the budget notification path before enabling `enable_budget_kill_switch`.
- Run `backup-postgres.sh --dry-run`.
- Run one real backup and verify it with `verify-latest-backup.sh`.
- Enable the systemd timer after a successful manual backup.
- Run a restore drill before launch.

## Beta Launch Checklist

### Environment and Supabase

- Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Confirm no service-role key is present in frontend code, README examples, or
  committed files.
- Apply Supabase migrations in order.
- Confirm RLS policies are enabled and learner progress is scoped to the
  authenticated user.

### Admin and content

- Create or promote an admin account by setting `profiles.role` to `admin`.
- Log in as admin and confirm `/admin` loads.
- Review `question_bank_items` in admin inventory.
- Confirm draft, published, and archived statuses work.
- Publish only reviewed learner-safe content.
- Validate import/export on `/admin/questions/import-export`.
- Confirm seed content starts as draft unless intentionally published.

### Learner QA

- Complete Topographical practice while signed out and confirm local progress
  saves.
- Complete SERU-style practice while signed out and confirm local progress
  saves.
- Log in and complete Topographical practice; confirm `/account` progress
  updates from Supabase.
- Log in and complete SERU-style practice; confirm account and review data stay
  scoped to the current user.
- Complete a topographical mock exam and review results.
- Confirm SERU questions do not appear in topographical mock exams.
- Open `/review` and `/progress/mistakes` and confirm answer history remains
  readable.

### Public and monetisation QA

- Open `/`, `/course`, `/topographical`, `/seru`, `/demo`, and `/pricing` on
  desktop and mobile widths.
- Confirm the Course dropdown links only to Topographical Course, SERU Course,
  and How the course works.
- Complete `/demo/topographical` and `/demo/seru`; confirm each demo is short,
  timed, and limited to 10 questions.
- Open `/pricing` and confirm Free is available now while Plus and Pro are
  coming soon.
- Click Register interest and confirm the page shows a confirmation without
  asking for email or payment details.
- Confirm no checkout, payment form, subscription state, or payment provider is
  active.

### Mobile, disclaimers, and launch safety

- Check homepage, Course, Demo, Pricing, Practice, Mock Test, Progress, Account,
  and Admin on mobile width.
- Confirm buttons remain tappable and no learner sidebar appears on public
  logged-out pages.
- Confirm disclaimers mention independent learning support and no TfL
  affiliation.
- Confirm SERU-style questions are described as original learning questions, not
  official TfL questions.
- Confirm logs do not include learner answers, tokens, cookies, passwords, raw
  Supabase user objects, or payment data.

## Phase 3 Manual QA Checklist

### Public learner flow

- Open the home page.
- Open `/learn`.
- Start practice while signed out.
- Answer practice questions.
- Confirm local progress remains available.
- Start a mock exam while signed out.
- Confirm the mock result saves locally.

### Auth and account flow

- Sign up with a learner account.
- Confirm email if required by Supabase.
- Log in.
- Confirm the navbar changes to Account/Sign out.
- Open `/account`.
- Confirm profile and progress summary render.
- Sign out.
- Confirm public learner routes still work.

### Signed-in progress flow

- Log in.
- Complete a practice question.
- Complete a mock exam.
- Refresh `/account`.
- Confirm practice and mock counts update from Supabase.

### Admin flow

- Signed-out users visiting `/admin` redirect to `/auth/log-in`.
- Confirm the redirect includes `?next=/admin`.
- Signed-in learner accounts with `profiles.role = 'learner'` see a clear not
  authorised state for `/admin`.
- Signed-in admin accounts with `profiles.role = 'admin'` can open `/admin` and
  nested admin question routes.
- Confirm the question inventory loads.

### Question publishing flow

- Create or locate a draft question.
- Confirm learner pages do not show draft questions.
- Publish the question.
- Confirm learner pages can show it.
- Archive the question.
- Confirm learner pages no longer show it.

### Import/export flow

- As an admin, open `/admin/questions/import-export`.
- Export all questions.
- Export published only.
- Export draft only.
- Export archived only.
- Preview a valid import file.
- Preview an invalid import file.
- Confirm invalid records do not commit.
- Commit valid records as admin.
- Confirm imported records appear in admin inventory.
- Confirm draft imports are hidden from learners.

### Production seed flow

- Confirm `supabase/seed/question_bank_items.json` previews successfully in
  `/admin/questions/import-export`.
- Run `npm.cmd run seed:questions` in a configured local environment.
- Confirm seeded records appear in `/admin/questions`.
- Confirm seeded records are `draft` by default and hidden from learners.
- Publish one reviewed seed record and confirm it can be returned by
  learner-safe database reads.
- As an admin, open `/admin/questions/import-export`.
- Import with create-only mode using a new ID.
- Import with upsert mode using an existing ID.
- Confirm imported records are written to `question_bank_items`.
- Confirm records without explicit status import as `draft`.
- Confirm draft and archived Supabase `question_bank_items` rows do not appear
  in any database-backed learner question read.
- Confirm published Supabase `question_bank_items` rows can be returned by the
  learner-safe question repository.

### Regression flow

- Learner practice, mock exam, progress, and account routes remain accessible.
- Signed-in learner progress saving from Stage 29 still works.
- Confirm signed-out practice, mock exam, progress, and mistake review still
  work with local browser persistence.
- Existing admin prototype editing/export behaviour is unchanged for admins.
- Mobile admin access-denied and admin pages remain readable.

### Production safety flow

- Visit a missing route and confirm the not-found page is readable.
- Trigger a safe test error and confirm the generic error page.
- Open `/account` while signed out and signed in.
- Confirm `/account` shows a clean fallback if account progress cannot load.
- Confirm admin and account loading states render during async navigation.
- Trigger invalid JSON in `/admin/questions/import-export` and confirm the
  error is clear without exposing stack traces or raw payloads.
- Trigger an import validation failure and confirm no records are committed.
- Confirm logs do not contain Supabase secrets, cookies, raw imported JSON, full
  user objects, or learner answers.
- No service-role keys are needed in the app.

## Stage 35.6 Manual QA Checklist

### Account isolation

- Create learner account A.
- Complete practice and a mock exam.
- Sign out.
- Create learner account B.
- Confirm B does not see A's account, progress, review, or mistake data.
- Sign back into A.
- Confirm A still sees A's own account-backed data.

### Review page

- Complete practice questions.
- Complete a mock exam.
- Open `/review`.
- Confirm all saved answers appear.
- Filter by subject.
- Filter by correct only.
- Filter by incorrect only.
- Filter by question type.
- Filter by practice/mock source.
- Confirm `/progress/mistakes` matches the incorrect review items.

### Exam UX

- Start a mock exam.
- Answer a map-click question.
- Press Next once and confirm it advances.
- Answer a route-planning question.
- Press Next once and confirm it advances.
- Press Next on a map-click question without selecting a location and confirm
  validation prevents advancing.
- Press Next on a route-planning question without drawing a route and confirm
  validation prevents advancing.
- Complete the exam.
- Confirm score and review answers are correct.

## Stage 36 Manual QA Checklist

### Draft content review

- Open `/admin/questions` as an admin.
- Confirm the inventory shows status, topic, difficulty, source, and validation
  columns.
- Filter by `draft`, `published`, `archived`, and `not-saved`.
- Filter by several topics, including `Route planning`, `Map interpretation`,
  and `Stations and transport hubs`.
- Filter by `easy`, `medium`, and `hard`.
- Confirm imported database-only rows appear in the same inventory.

### Seed/import workflow

- Open `/admin/questions/import-export`.
- Paste or upload `supabase/seed/question_bank_items.json`.
- Preview the import and confirm valid records show topic and difficulty.
- Confirm all seed records are `draft`.
- Try an invalid topic and confirm the preview rejects it clearly.
- Try an invalid difficulty and confirm the preview rejects it clearly.
- Commit valid seed records as an admin in a configured Supabase environment.

### Learner visibility

- Confirm draft seed records do not appear in learner practice, mock exam, or
  learner-safe question reads.
- Publish one reviewed sample question from `/admin/questions`.
- Confirm the published sample can be returned by learner-safe Supabase reads.
- Archive the sample and confirm it is hidden from learner-safe reads again.
- Confirm signed-out local practice and mock exam flows still work.
- Confirm signed-in progress saving still works after publishing changes.

## Stage 37 Manual QA Checklist

### Learner practice polish

- Open `/practice` on desktop and mobile width.
- Confirm topic cards show counts for knowledge, map-click, and route sessions.
- Complete a few answers incorrectly, return to `/practice`, and confirm weak
  topics are highlighted from saved history.
- Start a topic-filtered knowledge session and confirm the intro shows the
  selected topic/difficulty.
- Change difficulty from the session intro and confirm the question set updates.
- Submit a knowledge answer and confirm correct answer plus explanation/tip are
  easy to read.
- Start a topic-filtered map-click session, submit a click, and confirm distance
  feedback plus accepted-area guidance appears.
- Start a topic-filtered route session, draw a route, and confirm route feedback
  plus explanation appears.
- Confirm each practice session summary shows score, topic breakdown, and wrong
  answers from the current session.
- Confirm empty topic/style combinations show a helpful empty state.

### Admin review polish

- Sign in as an admin and open `/admin/questions`.
- Select multiple draft or not-saved rows and use Publish selected.
- Select multiple rows and use Archive selected.
- Move selected rows back to draft.
- Confirm non-admin learners cannot access `/admin/questions` or batch actions.
- Open a source-bank row with Review / preview and inspect the learner preview.
- Open an imported Supabase-only row with Review / preview and inspect the
  learner preview.
- Preview invalid import JSON and confirm errors identify record number and
  field without exposing raw payloads in logs.
- Confirm learner-safe reads still return only `status = 'published'`.

## Stage 38 Manual QA Checklist

### Home page

- Open `/` on desktop and mobile width.
- Confirm the hero explains TfL/topographical-test practice clearly.
- Use Start practice, Take a mock exam, and View progress CTAs.
- Confirm the generated map preview renders.
- Confirm map-click, route practice, and knowledge practice links work.
- Confirm no admin-only publishing/import/export features are promoted publicly.

### Progress and account dashboards

- Open `/progress` while signed out with no local activity and confirm the empty
  state is helpful.
- Complete knowledge, map-click, route, and mock exam attempts while signed out.
- Reopen `/progress` and confirm totals, accuracy, topic strengths/weaknesses,
  and recent activity update from local data.
- Sign in, complete a practice question and mock exam, then open `/account`.
- Confirm account-backed totals, topic snapshot, and recent activity render.
- Confirm signed-out local progress still remains available after signing out.

### Mock exam polish

- Complete a mock exam with a passing score and confirm pass-level feedback,
  topic breakdown, and next-step guidance.
- Complete or simulate a failed mock and confirm below-pass feedback and weakest
  topic guidance.
- Open Review answers from the result screen.
- Confirm each review card shows question, learner answer, accepted answer,
  correctness, topic, difficulty, score, and explanation.
- Confirm old/incomplete review metadata shows a fallback instead of crashing.

## Stage 39 Manual QA Checklist

### Homepage and conversion

- Open `/` on desktop and mobile width.
- Confirm the hero copy says "Build confidence for your TfL private hire
  journey".
- Confirm the custom practice-overview visual renders cleanly and replaces the
  old screenshot/map-preview hero.
- Use Start practising, Explore SERU preparation, View progress, and View
  pricing preview CTAs.
- Confirm no admin-only publishing, import/export, draft, archived, or database
  table details appear on the public home page.
- Confirm the independent/non-affiliation disclaimer is visible.

### SERU positioning

- Open `/practice/seru`.
- Confirm SERU is described as a separate preparation area.
- Confirm SERU topics include safety, equality, accessibility, customer
  service, safeguarding, licensing rules, driver responsibilities, complaints,
  lost property, and regulatory awareness.
- Confirm current topographical mock exams do not include a SERU mode.
- Confirm `/practice` links to SERU as an active separate practice area, not as
  part of the topographical mock set.

### Pricing preview

- Open `/pricing` on desktop and mobile width.
- Confirm Free, Plus, and SERU preparation tiers stack cleanly.
- Confirm payment is clearly marked as not live.
- Confirm one account is described as planned for both Topographical and SERU
  preparation.
- Confirm no payment form, checkout, Stripe redirect, or subscription logic is
  present.

### SEO, social, and analytics

- Inspect Home, Learn, Practice, Mock Test, Progress, Resources, and Pricing
  metadata in the browser or built output.
- Confirm `public/social/topopass-social.svg` is reachable.
- Click home/pricing/practice/mock CTAs and confirm no console errors.
- Confirm analytics remains no-op unless a provider is deliberately attached.
- Confirm analytics does not send emails, learner answers, tokens, raw payloads,
  cookies, passwords, or Supabase user objects.

### Regression checks

- Start signed-out practice and confirm local progress still saves.
- Complete a signed-out topographical mock exam and confirm review still works.
- Sign in, complete a practice answer, and confirm account-backed progress still
  works with Supabase configured.
- Visit `/admin` signed out and as a learner to confirm admin protection remains
  unchanged.

## Stage 39.5 Manual QA Checklist

### SERU starter practice

- Open `/practice/seru` on desktop and mobile width.
- Confirm the page explains SERU-style practice as separate from
  Topographical Skills.
- Filter by a SERU topic such as `Equality and accessibility`.
- Filter by difficulty.
- Answer a SERU question correctly and confirm explanation/tip feedback appears.
- Answer a SERU question incorrectly and confirm the accepted answer is clear.
- Confirm signed-out local progress still saves after SERU practice.
- Sign in, answer a SERU question, and confirm normal signed-in progress saving
  still works with Supabase configured.

### SERU separation

- Open `/mock-test`.
- Confirm the mock-test intro says the current mocks are topographical and that
  SERU mock exams are separate/future.
- Complete a topographical mock and confirm no SERU question appears.
- Open `/review` after SERU practice and confirm the SERU answer appears in
  review history.
- Open `/progress` and `/account` after SERU practice and confirm the
  Topographical/SERU preparation cards remain separated.
- Open `/admin/questions` as an admin and confirm SERU records appear in the
  inventory with SERU topics.
- Confirm non-admin learners still cannot access admin question tools.

## Stage 39.6 Manual QA Checklist

### Practice journey

- Open `/practice` on desktop and mobile width.
- Confirm the page explains that Practice is the real learning area.
- Use Start topographical practice and confirm it opens `/practice/topographical`.
- Use Start SERU practice and confirm it opens `/practice/seru`.
- Confirm Topographical and SERU-style practice are described as separate.
- Confirm Review mistakes, Try mock exam, and Try the short demo links work.

### Topographical practice

- Open `/practice/topographical`.
- Confirm the intro explains London map, route, direction sense, and journey
  planning confidence.
- Confirm the topic selector appears below the intro.
- Complete knowledge, map-click, and route practice from topographical topic
  links.
- Confirm weak-topic guidance is helpful without overwhelming the page.
- Open `/mock-test` and confirm topographical mock exams still exclude SERU
  questions.

### SERU-style practice

- Open `/practice/seru`.
- Confirm the page uses "SERU-style practice" or "SERU preparation" wording.
- Confirm it does not claim official TfL affiliation or official questions.
- Use Start SERU practice and confirm it jumps to the SERU practice flow.
- Filter by a SERU topic and answer a question.
- Confirm explanations still appear and progress still saves locally while
  signed out.

### Demo and navigation

- Open `/demo`.
- Confirm it is described as a short public preview, not the full practice
  area.
- Use Start full practice and Create account to save progress CTAs.
- While signed out, confirm main nav shows Topographical, SERU, Demo,
  Resources, Pricing, Sign in, and Start practising.
- While signed in, confirm main nav shows Dashboard, Practice, Mock Test,
  Review, Progress, Account, and Sign out.
- Confirm the sidebar groups Study, Practice, Review, and Account links.

## Stage 39.7 Manual QA Checklist

### Public assessment pages

- Open `/course` signed out on desktop and mobile width.
- Confirm the page explains the course journey, included course areas, preview
  cards, focused revision, and independent learning support.
- Confirm `/course` has no learner sidebar.
- Open `/topographical` signed out on desktop and mobile width.
- Confirm the page explains the Topographical Course clearly.
- Confirm it has no learner sidebar.
- Use Start topographical practice, Try demo, and View pricing.
- Open `/seru` signed out on desktop and mobile width.
- Confirm the page explains SERU-style preparation clearly.
- Confirm it has no learner sidebar.
- Confirm SERU content is described as original SERU-style practice, not
  official TfL questions.
- Use Start SERU practice, Try demo, and View pricing.

### Logged-out navigation

- Open `/` signed out.
- Confirm the public nav shows Course, Demo, Resources, Pricing, Sign in, and
  Start practising.
- Open the Course dropdown and confirm it links to Topographical Course, SERU
  Course, and How the course works.
- Confirm the Course dropdown does not include Free demo.
- Confirm Demo remains a separate main public nav item.
- Confirm Progress is not a main public nav item.

### Demo split

- Open `/demo` signed out.
- Confirm it shows separate Topographical demo and SERU demo cards.
- Start `/demo/topographical`.
- Confirm it is timed, limited to 10 questions, and shows instant feedback.
- Complete the Topographical demo and confirm the short result summary appears.
- Start `/demo/seru`.
- Confirm it is timed, limited to 10 questions, and shows instant feedback.
- Complete the SERU demo and confirm the short result summary appears.
- Confirm demo result CTAs point to full practice and account sign-in.
- Confirm demo pages do not show full topic filters, weak-topic dashboard,
  mock exams, admin content, or account-only features.

### Logged-in navigation regression

- Sign in as a learner.
- Confirm the main nav shows Dashboard, Practice, Mock Test, Review, Progress,
  Account, and Sign out.
- Confirm app pages still show the learner sidebar where expected.
- Confirm `/practice/topographical`, `/practice/seru`, and `/mock-test` still
  work and SERU questions remain excluded from topographical mock exams.

## Current Limitations

- Learner accounts are optional; signed-in completions save to Supabase, but
  local-to-account migration is not implemented yet.
- Demo is a short public preview with separate 10-question Topographical and
  SERU routes, not the full guided Practice mode.
- Legacy `/login` and `/register` remain placeholder routes; active auth lives
  under `/auth/*`.
- The progress dashboard uses browser-local progress for signed-out learners
  and account-scoped Supabase progress for signed-in learners when configured.
- Admin tools are permission-protected by profile role; create/edit managers
  remain prototype-level browser-local editors.
- Static TypeScript question banks remain the active learner content source.
- Supabase account progress writes are implemented for new signed-in practice
  and mock completions; broader syncing and migration remain deferred.
- A full multi-step editorial approval workflow is not implemented yet; current
  production review is admin-managed draft, publish, and archive.
- Payment and subscription logic is not implemented.
- SERU starter practice is implemented as a separate knowledge area; SERU mock
  exams and deeper SERU analytics remain future work.
- Analytics is structured and typed, but no third-party provider is connected.
- External production observability services are not implemented; logging is
  currently local/server-console only.
- AWS EC2 public-IP HTTP deployment is live for smoke testing only. Domain,
  Route 53, and HTTPS remain paused.
- GitHub Actions deploy-to-EC2 automation, Route 53, and HTTPS production launch
  remain deferred post-Phase-4 work.
- Route scoring still needs calibration against more reviewed real-world
  learner attempts.
- The generated driver-training atlas asset is a review artifact and is not the
  live map UI.

## Supporting Documentation

- `docs/mobile-accessibility-qa.md`
- `docs/free-atlas-map-workflow.md`
- `docs/os-qgis-atlas-poc.md`
- `docs/cleanroom-driver-training-atlas-generation.md`
- `docs/production-question-content.md`
- `docs/aws-ec2-devops-deployment.md`
- `docs/TECHNICAL_DEBT.md`
- `docs/MANUAL_QA_CHECKLIST.md`

