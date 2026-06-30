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

## Stage 49 Map Engine Architecture

- Added a shared TypeScript domain model for custom fictional maps.
- Added map nodes, roads, directed edges, restrictions, landmarks, route
  exercises, route attempts, and route score result types.
- Added directed edge generation from one-way and two-way roads.
- Added lightweight map and route exercise validation.
- Added a tiny fictional map fixture and tests.
- No UI, drawing, scoring, routefinding, OSM import, Google, Mapbox, or
  real-world map data was added.

## Stage 50 Fake Development Map Fixture

- Added Marlowe District as the canonical fake development map for route-engine
  tests.
- The fixture is fictional and does not use real map, OSM, Google, Mapbox, OS,
  or A-Z data.
- It includes 24 junctions, 38 roads, one-way roads, explicit no-entry rules,
  prohibited turns, landmarks, and route exercises.
- It is designed for controlled route-engine development only.
- No UI, drawing, scoring, routefinding, snapping, renderer, or import logic was
  added.

## Stage 51 Graph Builder

- Added a routing-ready graph builder for the custom map engine.
- Converts roads into directed edges using the existing directed-edge helper.
- Two-way roads become two directed edges; one-way roads become one directed
  edge.
- Adds graph indexes for nodes, roads, edges, outgoing edges, and incoming
  edges.
- Validates map definitions before graph construction and throws on invalid
  references.
- Added tests for the tiny fixture, Marlowe District fixture, and invalid map
  rejection.
- No UI, drawing, snapping, scoring, routefinding, renderer, or backend changes
  were added.

## Stage 51.5 Shortest Legal Route Engine

- Added a pure Dijkstra-based shortest route engine for the custom map engine.
- Calculates the shortest valid route between two map nodes by distance in
  metres.
- Uses the Stage 51 directed graph indexes and outgoing-edge lookup.
- Respects one-way roads through the graph's directed edges.
- Supports no-entry restrictions by blocking matching directed movements.
- Supports prohibited-turn restrictions with transition-aware search state that
  tracks the previous edge.
- Returns route distance, edge sequence, road sequence, and node sequence.
- Handles invalid start/end nodes, no-route cases, and zero-distance routes.
- No UI, drawing, snapping, scoring, Supabase, backend, deployment, or website
  page changes were added.

## Stage 52 Legal Movement Graph

- Added a legal movement graph for the custom map engine.
- One-way roads, no-entry restrictions, and prohibited turns are represented as
  legal directed movements and transitions.
- No-entry restrictions remove only blocked directed edges, unless the
  restriction is road-wide.
- Prohibited turns block only the matching transition at the relevant node.
- Added helpers for legal outgoing movements from a node, legal next movements
  after an edge, and legal movements from a current position.
- Added validation for no-entry endpoint references and prohibited-turn
  connectivity.
- Added tests for one-way, no-entry, prohibited-turn, position validation, and
  Marlowe District fixture behaviour.
- No UI, drawing, snapping, scoring, shortest-path routing, renderer, Supabase,
  or deployment code was added.

## Stage 53 Legality Engine

- Added a dedicated route-attempt legality checker for the custom map engine.
- Checks attempted road movements against the map definition and reports exact
  illegal movement reasons.
- Detects wrong-way one-way use, no-entry movements, prohibited turns, immediate
  U-turns, disconnected road jumps, unknown roads, and unknown nodes.
- Includes the reserved `off_road` illegal movement type for later snapped
  geometry checks without faking geometric detection now.
- Any illegal movement returns `automaticFail: true`; legal movement lists return
  `isLegal: true`.
- Added deterministic tests for legal movement, each illegal movement type,
  multiple violations, and unknown movement references.
- No UI, drawing, snapping, scoring integration, Supabase, backend, deployment,
  or website page changes were added.

## Stage 54 Route Comparison / Efficiency & Scoring Engine

- Added a pure route scoring engine for custom map-engine route attempts.
- Scores legal user routes as `shortestLegalRouteDistance / userRouteDistance`.
- Uses Stage 53 legality checks so illegal movements automatically fail.
- Uses Stage 51.5 shortest legal route calculation rather than hardcoded
  shortest distances.
- Calculates user route distance from attempted road movements and map road
  distances.
- Scores ordered required-stop routes using `requiredStopNodeIds`, so A to B
  must start at A and end at B, and A to B to C to D must visit B, C, and D in
  order.
- Calculates multi-stop shortest legal distance as the sum of each required
  shortest leg, such as A to B plus B to C plus C to D.
- Fails wrong starts, wrong destinations, missing required stops, and stops
  visited out of order.
- Applies the 80% pass threshold; exactly 80% passes and anything below fails.
- Safely handles zero or invalid route distances without divide-by-zero.
- Added tests for exact shortest routes, efficient and inefficient routes,
  threshold boundaries, ordered required stops, multi-stop shortest leg sums,
  illegal route auto-fail, disconnected jumps, and Marlowe no-entry/prohibited
  turn failures.
- No UI, drawing, snapping integration, Supabase, backend, deployment, or real
  map data changes were added.

## Stage 54.5 Route Comparison / Efficiency Scoring Checkpoint

- Confirmed the scoring engine supports ordered required stops.
- A route from A to B must start at A and end at B.
- Multi-stop routes such as A to B to C to D must visit B, C, and D in order.
- Required stops visited out of order do not count, and missing intermediate
  stops fail deterministically.
- Multi-stop shortest legal distance is calculated as the sum of each shortest
  legal leg, while the user route distance remains the full attempted movement
  distance.
- Added tests for wrong starts, wrong destinations, missing intermediate stops,
  out-of-order stops, ordered-stop passes, and multi-stop shortest-leg sums.
- No UI, drawing, snapping, Supabase, backend, deployment, or real map data work
  was added.

## Stage 55 Route Attempt Normalisation / Exercise Runner

- Added a pure exercise runner that bridges route exercises and the map-engine
  scoring stack.
- Accepts a map, a route exercise list, an exercise ID, and a deterministic
  manual user route made from node IDs and/or road IDs.
- Resolves exercise landmark stops to required route node IDs.
- Normalises user route selections into selected nodes, selected roads, directed
  edge IDs where available, and attempted road movements.
- Validates unknown exercises, landmarks, nodes, roads, disconnected node
  sequences, and disconnected road sequences with clear deterministic errors.
- Reuses the existing scoring engine, which in turn reuses legality checks and
  shortest legal route calculation.
- Keeps the future drawing flow clean: drawn route to snapped route to node/road
  sequence to normalised route attempt to scoring.
- Added tests for Marlowe District end-to-end execution, route normalisation
  errors, wrong starts, missed/out-of-order destinations, illegal movement
  pass-through, and longer-than-shortest legal scoring.
- No UI, hand-drawn snapping, external routing, real map data, Supabase,
  backend, or deployment work was added.

## Stage 56 Route Exercise Developer Runner UI

- Added a developer/debug page at `/dev/route-runner`.
- The page uses the fictional Marlowe District fixture and the Stage 55
  `runRouteExercise` API inside the app.
- It lets a developer choose a route exercise, inspect the start and required
  stop landmarks, enter manual comma-separated node IDs and road IDs, then run
  the attempt.
- The result panel shows the normalised attempt and scoring result as readable
  JSON, including selected nodes, selected roads, directed edge IDs, score,
  pass/fail status, and failure reasons.
- Added a small parser helper for comma-separated route IDs and unit tests for
  whitespace, empty input, and duplicate comma handling.
- This is not the final drawing or snapping layer. The intended future flow is:
  drawing UI to snapped node/road sequence to Stage 55 runner to score.
- No real maps, external routing, Supabase, backend, auth, scoring-engine
  changes, or production navigation changes were added.

## Stage 57 Draft Route Selection State

- Added a pure TypeScript state utility for in-progress route exercise drafts.
- The draft state tracks a selected exercise ID plus ordered draft node IDs and
  road IDs.
- Helper actions create an empty state, select or clear an exercise, add/remove
  nodes, clear nodes, add/remove roads, clear roads, and clear the draft route.
- All helpers are pure and immutable, preserve insertion order, and allow
  repeated node or road IDs for routes that revisit the same place or road.
- Changing to a different exercise clears existing draft selections so stale
  route attempts are not carried across exercises; re-selecting the same
  exercise preserves the current draft.
- Derived helpers convert the draft into the Stage 55 `UserRouteSelectionInput`
  shape and into a runnable `{ exerciseId, selection }` draft only when an
  exercise is selected.
- Added tests for empty state, exercise switching, repeated IDs, safe no-op
  removals/clears, node and road independence, derived route selections, and
  defensive array copies.
- No UI, drawing, snapping, real map data, external routing, Supabase, backend,
  scoring, legality, shortest-route, or route-runner behavior changes were
  added.

## Stage 58 Route Draft Validation / Attempt Preview

- Added a pure frontend-safe draft validation and preview helper for route
  exercise attempts.
- The validator checks whether the selected exercise exists, whether the draft
  route is empty, whether selected node and road IDs are known, whether selected
  nodes or roads form connected movements, and whether the draft starts at the
  required start.
- The preview reports selected nodes, selected roads, the current node, required
  stop node IDs, required-stop progress, the next required stop, destination
  status, and selected-route distance.
- Required stops are checked in order, so skipped or out-of-order stops are
  surfaced before a draft is submitted.
- Complete structurally valid drafts are marked ready to submit and include the
  Stage 55 normalised attempt generated through `runRouteExercise`.
- Added `canSubmitDraftRoute` as a small convenience helper for UI code.
- Added tests for unknown exercises, empty drafts, unknown node/road IDs,
  disconnected routes, wrong starts, missing destinations, missed required
  stops, out-of-order stops, ready-to-submit drafts, defensive preview copies,
  and submit readiness.
- No drawing UI, snapping, real map data, external routing, Supabase, backend,
  scoring formula, legality, shortest-route, or route-runner behavior changes
  were added.

## Stage 59 Manual Route Input UI

- Extended the `/dev/route-runner` developer page so manual node/road route
  attempts show a clearer route-engine result summary.
- The result panel now separates pass/fail status, score percentage, shortest
  legal distance, user route distance, extra distance, failure reasons,
  violations, normalised node and road sequences, attempted movements, and raw
  JSON for debugging.
- Manual route scoring still flows through the existing Stage 55
  `runRouteExercise` API.
- No drawing-based scoring, route matching, backend, storage, analytics, or
  scoring/legality changes were added.

## Stage 60 Drawing Capture Foundation

- Added a pure drawn-route trace utility for raw route drawing state.
- Added browser canvas drawing support to `/dev/route-runner` using pointer
  events so mouse, touch, and stylus share the same capture path where the
  browser supports it.
- Captured drawn points are stored in map coordinates with screen-to-map and
  map-to-screen conversion helpers.
- Added clear/reset handling and simple trace simplification helpers.
- The drawn trace is a preview-only development input and is not submitted to
  route scoring.

## Stage 61 Geometry and Spatial Index Foundation

- Added map-engine geometry helpers for point-to-segment projection,
  point-to-polyline projection, point-to-road-centreline distance, polyline
  length, heading calculation, bounding boxes, trace simplification, and road
  candidate lookup.
- Added a lightweight deterministic road spatial index based on expanded road
  bounding boxes, which is sufficient for the fictional Marlowe District
  fixture.
- Added tests for horizontal, vertical, diagonal, and polyline projection,
  heading/distance calculations, bounding boxes, trace simplification, and
  Marlowe road candidate lookup.
- No external routing dependency, real map import, OSM import, or route
  matching was added.

## Stage 62 Basic Route Snapping

- Added a basic snapping module that converts raw drawn points into snapped road
  candidates for the fake map-engine data.
- Snapped points include original point, snapped point, road ID when in
  tolerance, optional directed edge ID, distance from road, confidence, and
  candidate matches.
- Off-road points are diagnosed, repeated points are safe, very short traces
  return a clear diagnostic, and results are deterministic.
- `/dev/route-runner` shows a snap preview over the canvas, but snapped traces
  are not converted into route attempts or scored yet.
- Stage 63 route matching, drawn-route scoring, replay, production feedback UI,
  persistence, analytics, and real map imports remain intentionally deferred.

## Stage 63 Core Route Matching Engine

- Added a pure deterministic route matcher that consumes Stage 62 snapped route
  points and prepares an ordered route selection for the existing route exercise
  pipeline.
- The matcher collapses consecutive duplicate road IDs while preserving
  non-consecutive repeats, infers transition nodes for connected road chains,
  and returns ordered road IDs, transition node IDs, node IDs, directed edge IDs
  where legal, attempted movements, and a `UserRouteSelectionInput`.
- Empty and insufficient snapped inputs return stable non-throwing statuses.
- Unknown roads, unmatched points, disconnected road sequences, ambiguous
  transitions, and unresolved or wrong-way directed edges are reported through
  deterministic diagnostics.
- Marlowe District fixture tests confirm a matched snapped route can be passed
  into the existing `runRouteExercise` flow without changing scoring.
- Stage 63 does not implement advanced HMM/probabilistic map matching, new
  snapping, drawn-route scoring, production UI, backend persistence, analytics,
  London/OSM imports, or changes to scoring, legality, shortest-route, fixtures,
  or route-runner behavior.

## Stage 63.5 Drawn Route Matching Pipeline

- Added a pure dev-only drawn route pipeline that connects raw drawn traces,
  conservative trace simplification, Stage 62 snapping, Stage 63 route matching,
  and the existing Stage 55 `runRouteExercise` scorer.
- The pipeline returns stable statuses for empty, insufficient, snapping-failed,
  matching-failed, exercise-failed, and scored drawn attempts without throwing
  for expected in-progress drawing states.
- `/dev/route-runner` now shows a drawn route pipeline panel with simplified
  point count, snapped point count, matched road IDs, matched node IDs, directed
  edge IDs, matcher/pipeline warnings, and exercise scoring output when a drawn
  route is scoreable.
- Tests cover clean Marlowe drawn routes, disconnected drawn routes, wrong-way
  one-way routes, prohibited-turn routes, duplicate road collapse, and
  compatibility with the existing manual route runner flow.
- Stage 63.5 remains deterministic and development-only. It does not add
  advanced HMM/probabilistic map matching, new snapping, real London/OSM map
  imports, backend persistence, analytics, production drawing UI, or changes to
  scoring, legality, shortest-route, fixture, or runner algorithms.

## Stage 64 Drawn Route UX Hardening

- Hardened the `/dev/route-runner` drawn-route experience with clearer drawing
  instructions, active drawing state, selected-exercise attempt status, reset
  behaviour, stage badges, and grouped warning/scoring notes.
- The dev canvas now overlays raw drawing, snapped preview points, matched
  route movements, matched nodes, ordered stops, movement arrows, and unresolved
  direction highlights for debugging.
- Clearing the drawing resets the raw trace, simplified trace, snapped result,
  matched result, warning display, score output, overlays, and status badges
  through the existing derived pipeline state.
- Starting a new drawing hides stale drawn-route score output until the pointer
  is released, and changing the selected exercise resets the drawn attempt.
- Added pure display-helper tests for drawn pipeline statuses, stage badges,
  and human-readable warning/scoring messages.
- Stage 64 does not add new route intelligence, scoring integration changes,
  matcher changes, backend persistence, analytics, production drawing UI,
  London/OSM imports, or Supabase/auth work.

## Stage 64.5 Drawn Route Scoring Integration

- Completed the first end-to-end development browser flow for drawn route
  attempts: select an exercise, draw a route, simplify the trace, snap it,
  match roads/nodes/directed edges, run `runRouteExercise`, and show the score.
- The `/dev/route-runner` drawn result panel now clearly distinguishes routes
  blocked before scoring, routes scored and failed, and routes scored and
  passed.
- The score display shows pass/fail status, score percentage, shortest legal
  distance, user route distance, extra distance, failure reasons, illegal
  movement violations, and ordered required-stop progress.
- Multi-stop exercises show each ordered start/checkpoint/destination node as
  visited or missing/out of order using the existing exercise/scoring result.
- Tests cover clean drawn route scoring, long legal drawn routes failing below
  the pass mark, illegal drawn routes failing automatically, multi-stop
  required-stop output, blocked pre-scoring routes, stale-score hiding while
  drawing, and manual route-runner compatibility.
- Stage 64.5 does not add advanced matcher improvements, new routing
  intelligence, production storage, analytics, London/OSM imports, backend
  changes, Supabase changes, or auth changes.

## Stage 65 Connectivity-Aware Candidate Matching

- Improved drawn-route snapping candidate selection so nearby road candidates
  are evaluated as a connected sequence instead of choosing each point's
  nearest road independently.
- Snapping now strongly penalizes transitions between roads that do not share
  a real map node, while still preferring same-road continuity and connected
  road changes at junctions.
- Snapping results include selected-candidate flags, candidate counts,
  collapsed road IDs, total path cost, and disconnected transition diagnostics
  for dev-route-runner debugging.
- This reduces road flicker such as disconnected road jumps inside an otherwise
  clean drawn trace before the Stage 63 matcher validates the final sequence.
- Genuine disconnected drawings are still left disconnected and remain blocked
  by the existing matcher before scoring.
- Stage 65 does not change scoring, legality, shortest-route behavior,
  production UI, backend persistence, London/OSM imports, or real map data.

## Stage 66 Restriction / No-Entry Visual Overlay

- Added dev-route-runner road restriction overlays so existing map-engine
  one-way, no-entry, and road-closed restrictions are visible before drawing.
- The `/dev/route-runner` canvas now draws red barred no-entry markings, amber
  restricted-road markings, and blue one-way arrowheads using the existing
  Marlowe District fixture data.
- Added a pure `buildRoadRestrictionOverlays` display helper with deterministic
  tests for one-way, no-entry, road-closed, and turn-only restriction handling.
- Stage 66 focused on road-level overlays; the later Stage 68 section documents
  the separate turn-level junction overlay.
- Stage 66 is visual-only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  or exercise semantics.

## Stage 66.5 Route Runner Overlay UX + Legal Fixture Path Fix

- Stabilised the `/dev/route-runner` drawing area so status changes, drawing
  start/end messages, and clear-button layout do not shift the canvas viewport.
- Road-level restriction overlays now keep symbol markers on the canvas but no
  longer paint long `No entry...` labels directly over the map.
- Updated the Marlowe District fixture with a minimal road-direction adjustment
  so the current `Fox Lane Station to Northgate Hospital` dev exercise has at
  least one fully legal route.
- Added route-runner tests proving the station-to-hospital exercise has a
  shortest legal route, the known legal route passes, and an intentional
  no-entry attempt still fails.
- Stage 66.5 does not change scoring, legality, shortest-route behavior,
  snapping, matching, backend persistence, or exercise-runner semantics.

## Stage 67 Illegal Route Feedback Overlay

- Added dev-route-runner failure overlays that highlight illegal or broken
  parts of a drawn route after snapping, matching, and scoring.
- The `/dev/route-runner` canvas now marks wrong-way, no-entry, prohibited
  turn, U-turn, illegal movement, and disconnected-road transition diagnostics
  from the existing pipeline/scoring result with symbol-only highlights.
- Road-level route issues take precedence in the visual language: no-entry and
  one-way violations are shown as road-level issues instead of duplicating them
  with turn-restriction signs.
- Route-issue red line semantics are consistent: solid red marks an illegal or
  blocked route section, while dashed red marks a disconnected snapped
  transition.
- Passing routes do not show route-issue overlays, keeping successful attempts
  visually clean.
- Added a compact route-issue message panel so the visible marker has a
  readable explanation without requiring raw JSON diagnostics or inline canvas
  text labels.
- Stage 67 is display-only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  or exercise semantics.

## Stage 68 Turn-Level Restriction Visuals

- Added pure map-engine turn restriction visuals for existing
  `prohibited_turn` fixture restrictions.
- Each visual includes the blocked `fromRoadId`, `toRoadId`, `viaNodeId`,
  junction coordinate, incoming road coordinate, outgoing road coordinate, and
  deterministic marker angles for UI rendering.
- The `/dev/route-runner` canvas now shows banned turn movements as compact
  no-left-turn, no-right-turn, or no-U-turn signs on the incoming approach road
  before the restricted junction, distinct from road-level no-entry/one-way
  restriction overlays and without painting turn-pair IDs on the map.
- Turn signs are only shown for genuine transition-level bans where both road
  directions are otherwise usable; redundant turns into no-entry, one-way, or
  closed road movements and visually straight movements are suppressed from the
  default canvas overlay.
- Turn sign type is geometry-derived from the incoming approach vector and
  outgoing road vector using the screen-coordinate signed angle; because SVG
  and canvas coordinates increase downward on the y-axis, a positive signed
  angle is a right turn and a negative signed angle is a left turn.
- Turn signs use driver-relative geometry classification with screen-upright
  sign faces; the red border, red slash, and internal black turn arrow are
  drawn upright in screen coordinates instead of being angled with the road.
  For mostly downward approaches, the displayed no-left/no-right glyph is
  swapped to match the driver's screen direction while the semantic restriction
  remains unchanged.
- Added dev checkboxes for `Show road restrictions` and
  `Show turn restrictions`; both default on for debugging and only affect the
  visual overlay.
- Stage 68 is visual/debug-only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  or exercise semantics.

## Stage 69 Illegal Drawn Movement Highlighting

- Added a pure map-engine illegal movement highlighting helper that converts
  scored legality failures into deterministic post-attempt route highlights.
- The helper groups failures by attempted movement and applies visual priority:
  restricted or closed road, no-entry road, wrong-way one-way movement, then
  explicit prohibited turn. This prevents duplicate no-entry plus no-turn
  warnings for the same drawn movement.
- The `/dev/route-runner` canvas keeps the normal drawn and snapped route
  visible underneath, then uses a stronger red overlay only for the offending
  movement after scoring. Road-level violations highlight the affected road
  movement; prohibited turns use a local transition marker instead of repainting
  whole roads.
- Stage 69 is post-attempt diagnostic display only and does not change scoring,
  legality, shortest-route behavior, snapping, matching, fixtures, backend
  persistence, or exercise semantics.

## Stage 70 Route Attempt Review Panel

- Added a pure route attempt review helper for `/dev/route-runner` that turns
  scored route results and Stage 69 illegal movement highlights into
  student-friendly pass/fail, score, distance, illegal movement, route
  requirement, and suggested failure reason copy.
- The review panel shows the student's route distance, shortest legal route
  distance, extra distance, illegal movement list, missed route requirements,
  and a plain-English likely failure reason.
- The dev route runner now shows a written post-attempt review alongside the
  existing score panel, visible issue overlays, and raw debug JSON.
- Stage 70 is display-only and does not change scoring, legality, shortest-route
  behavior, snapping, matching, fixtures, backend persistence, route drawing, or
  exercise semantics.

## Stage 71 Student-Friendly Correction Hints

- Added a pure correction-hint helper for `/dev/route-runner` that turns the
  Stage 70 review result into short learner-facing next-step guidance.
- Hints explain common outcomes such as prohibited turns, no-entry roads,
  wrong-way one-way use, missed checkpoints, wrong destinations, disconnected
  matched routes, and legal routes that are too long.
- The route runner review panel now shows a compact "Try next" section after a
  drawn route is reviewed, while keeping the existing raw diagnostics available
  for development.
- Stage 71 is display/review formatting only and does not change scoring,
  legality, shortest-route behavior, snapping, matching, fixtures, backend
  persistence, route drawing, or exercise semantics.

## Stage 72 Adaptive Practice Recommendations

- Added a pure adaptive recommendation helper for `/dev/route-runner` that
  turns the existing route attempt review and Stage 71 correction hints into
  stable learner-facing practice focus cards.
- Recommendations identify weak areas such as prohibited turns, no-entry roads,
  wrong-way one-way use, restricted roads, wrong starts, wrong destinations,
  missed checkpoints, disconnected or insufficient drawings, and legal routes
  that are too long.
- Each recommendation has a stable id, title, explanation, practice focus, and
  high/medium/low priority. Illegal and route-validity problems are high
  priority, while inefficient legal routes are medium or low depending on the
  score.
- The route runner review panel now shows a compact "Recommended practice"
  section after the "Try next" hints.
- Stage 72 is review/UI-layer only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  restriction classification, route drawing, or exercise semantics.

## Stage 73 Adaptive Practice Queue

- Added a pure recommended-practice queue helper for `/dev/route-runner` that
  converts Stage 72 recommendations into learner-facing next-practice items.
- Queue items include a stable id, title, reason, weakness type, priority, and
  an optional future suggested exercise id field so targeted practice launches
  can be wired in later without changing the review data shape.
- The route runner now shows a "Recommended next practice" panel after a
  submitted attempt, sorted by priority with high-priority route validity and
  illegal movement issues first.
- The panel includes an empty state for attempts that produce no targeted queue
  items: "Great work - no targeted practice needed from this attempt."
- Stage 73 is review/UI-layer only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  restriction classification, map-engine logic, route drawing, or exercise
  semantics.

## Stage 74 Persistent Learner Weak-Area Profile

- Added pure helpers that extract weak-area counters from an existing route
  attempt review and merge them into an accumulated learner weak-area profile.
- The profile tracks repeated no-entry, one-way, prohibited-turn, restricted
  road, wrong-start, wrong-destination, missed-checkpoint, disconnected drawing,
  insufficient drawing, and inefficient-route signals across reviewed attempts.
- The `/dev/route-runner` now keeps this profile in browser-local storage and
  shows a dev-only "Weak areas profile" panel with the strongest categories,
  attempt counts, total tracked signals, and a recommended next practice focus.
- The profile can be reset from the dev UI and remains local-only. No backend
  persistence, analytics storage, scoring, legality, snapping, matching,
  routefinding, fixture, restriction classification, or exercise semantics were
  changed.

## Stage 75 Route Attempt History

- Added pure in-session attempt history helpers for `/dev/route-runner` that
  convert completed route attempt reviews into compact saved summaries.
- The dev route runner now appends a history item after each submitted drawn
  route and keeps the latest attempt selected automatically.
- The review area shows an "Attempt history" panel with attempt number,
  pass/fail/blocked status, score, student route distance, extra distance,
  illegal movement count, missed restriction count, and the primary failure
  reason when available.
- Selecting an earlier attempt shows its saved review summary without
  recalculating scoring or changing the current route result.
- Stage 75 is review/UI-layer only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  restriction classification, route drawing, or exercise semantics.

## Stage 76.5 Attempt Storage

- Added a Supabase `route_attempts` table migration for completed
  `/dev/route-runner` attempt reviews, including score, pass/fail status,
  failure reason, distance metrics, violations, missed restrictions, correction
  hints, practice recommendations, matched route JSON, full review payload, and
  review schema version.
- Added an isolated route-attempt storage helper that maps the existing
  `RouteAttemptReview` plus already-computed scoring/matching output into the
  database row shape. The pure review builder remains Supabase-free.
- The dev route runner now attempts to save a completed drawn route review after
  feedback has been generated. Saving is non-blocking: failed or unavailable
  Supabase persistence shows a small warning while the review remains visible.
- Stage 76.5 stores attempt results only. It does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend scoring,
  restriction classification, route drawing, review semantics, teacher
  dashboards, or history browsing.

## Stage 76.6 Attempt History UI

- Added a Supabase read helper for saved `/dev/route-runner` attempts. It maps
  stored rows into learner-facing list items and queries attempts newest first,
  with optional exercise filtering and a safe development fallback for nullable
  user IDs.
- Added a saved attempt history panel to the route runner review area. The panel
  handles loading, empty, error, saved-list, refresh, and read-only review-detail
  states, and refreshes automatically after a new drawn route attempt is saved.
- Stage 76.6 is display/readback only. It does not replay routes or change
  scoring, legality, shortest-route behavior, snapping, matching, fixtures,
  backend scoring, restriction classification, or exercise semantics.

## Stage 77 Adaptive Practice Queue

- Added a pure adaptive practice queue builder for `/dev/route-runner`. It
  combines the latest route review, the local weak-area profile, in-session
  attempt-history insights, saved attempt summaries, and available development
  exercises into one ranked practice queue.
- Queue items include a stable id, item type, title, explanation, practice
  focus, urgent/high/medium/low priority, numeric score, reasons, related weak
  areas, related exercise ids, and source-signal flags for latest review,
  weak-area profile, attempt history, and saved attempts.
- The builder prioritises repeated mistakes, latest failed-route signals,
  legality-critical restrictions, declining attempts, saved repeated failures,
  and links to available route exercises. It also handles empty or malformed
  saved attempt data safely and keeps ordering deterministic.
- The route runner now shows a dev-friendly "Adaptive practice queue" panel
  with the primary focus, confidence level, source signals used, ranked queue
  items, practice focus, reasons, and related exercise ids.
- Stage 77 does not change scoring, legality, snapping, matching,
  shortest-route behavior, fixtures, backend schema, road restrictions,
  restriction classification, exercise semantics, or attempt storage schema.

## Stage 78 Adaptive Practice Session Launcher

- Added a dev-only adaptive practice launcher to `/dev/route-runner`. It uses
  the Stage 77 queue to let learners start, skip, dismiss, complete, and undo
  status for recommended practice items.
- Launcher state is stored in browser local storage under
  `topopass.dev.routeRunner.adaptivePracticeLauncher.v1`, with safe fallback
  handling for missing storage, malformed JSON, and older partial state.
- Starting a launcher item selects the linked development exercise when one is
  available, clears the current route draft and attempt result, and shows an
  active-session summary explaining why the exercise was chosen.
- Stage 78 is UI/session-state only. It does not change scoring, legality,
  snapping, matching, shortest-route behavior, map-engine logic, fixtures,
  backend behavior, Supabase behavior, exercise semantics, or restriction
  classification.

## Stage 79 Adaptive Practice Outcome Feedback Loop

- Added local adaptive outcome feedback for `/dev/route-runner` launcher
  sessions. When a learner marks an adaptive practice item complete, the route
  runner records whether the practice resolved the focus, improved but still
  needs work, repeated the same issue, produced mixed signals, or could not yet
  be judged.
- Outcome feedback compares the completed route review against the launched
  practice focus, including score, pass/fail state, illegal movement count,
  missed restriction count, extra distance, and strongest review weakness
  categories.
- Repeated issues boost the same future adaptive queue focus, resolved issues
  lower that focus, improved-but-not-resolved outcomes keep it active at lower
  urgency, and unknown outcomes do not materially affect queue ranking.
- The feedback history is stored inside the Stage 78 browser-local launcher
  state with migration-safe parsing for old or malformed localStorage values.
- Stage 79 is dev-only feedback/session state. It does not change scoring,
  legality, snapping, matching, shortest-route behavior, map-engine logic,
  fixtures, backend schema, Supabase behavior, exercise semantics, or
  restriction classification.

## Stage 80 Exercise/Map Metadata Layer

- Added a pure exercise and map metadata layer for `/dev/route-runner`, covering
  stable map identity, map kind, version, area label, difficulty, estimated
  minutes, skill tags, weak-area tags, restriction tags, route-feature tags,
  prerequisites, and related exercises.
- Added validation and lookup helpers for metadata catalogues, including
  duplicate-id checks, unknown map/exercise references, missing route-exercise
  metadata, invalid durations, missing tags, metadata indexes, and filtered
  searches by weak area, skill, and difficulty.
- The dev route runner now derives its adaptive practice exercise catalogue
  from the metadata layer and shows compact selected-exercise metadata in the
  exercise card.
- Stage 80 is metadata/indexing only. It does not change route scoring,
  pass/fail rules, legality, snapping, matching, shortest-route behavior, map
  fixtures, restriction behavior, saved attempt shape, backend schema, Supabase
  behavior, or exercise semantics.

## Stage 81 Product Route Runner Layout Shell

- Reworked `/dev/route-runner` into a product-style Route Runner shell with a
  top control bar, left exercise brief, central map workspace, right attempt
  review workspace, and bottom learning dashboard.
- The top bar now surfaces the selected route title, exercise position,
  difficulty, estimated time, elapsed-time placeholder, and quick Undo, Clear,
  and Submit Attempt controls for the drawn trace.
- The exercise brief now separates start, ordered checkpoints, finish, rules,
  metadata, skill tags, and weak-area tags while keeping the manual route ID
  runner available for development checks.
- The central map panel keeps the existing dev map renderer, drawing capture,
  snapping preview, restriction toggles, and overlay legend. The right review
  panel keeps the existing Stage 70-79 review, diagnostics, scoring, save,
  adaptive, weak-area, and history output.
- Added a bottom learning dashboard summary for adaptive queue, weak areas, and
  recent attempts using the current local/dev state. Stage 81 is layout/UI shell
  only and does not change scoring, legality, snapping, matching, shortest-route
  behavior, map fixtures, adaptive queue logic, attempt review semantics,
  backend schema, Supabase behavior, or exercise semantics.

## Stage 82 Synthetic Street Map Renderer

- Added a pure synthetic street-map rendering adapter for `/dev/route-runner`.
  It derives visual-only road classes, road styles, road labels, area labels,
  stop labels, background features, route overlay styles, and legend items from
  the existing synthetic Marlowe District map and route exercises.
- The route runner canvas now draws soft park/water/block background shapes,
  road casing and width hierarchy, reduced junction dots, road names, area
  labels, clearer start/checkpoint/finish labels, and a stronger matched-route
  overlay while preserving the existing drawing, snapping, matching, scoring,
  restriction, and review overlays.
- Background features are explicitly visual-only and do not enter routable graph
  calculations, snapping, scoring, legality, shortest-route logic, or attempt
  storage.
- The map still uses fake/dev data only. Stage 82 does not import OSM/Overpass
  data and does not change scoring, legality, snapping, route matching,
  shortest-route behavior, restriction classification, exercise semantics,
  backend schema, adaptive queue logic, attempt review logic, or attempt storage
  logic.

## Stage 83 Restriction Symbol Layer Polish

- Added a pure restriction symbol-layer model for `/dev/route-runner` covering
  no-entry, one-way, prohibited-turn, restricted-road, illegal-movement,
  disconnected-route, selected-focus, and legend visuals.
- The route runner canvas now uses clearer no-entry barred circles, blue
  one-way arrows, compact turn-ban signs, amber restricted-road symbols, and
  stronger route-issue markers on top of the Stage 82 synthetic street-map
  renderer.
- Review-panel route issues now support a "Show on map" focus action where a
  matching visual target exists. The selected item receives a blue focus halo
  without changing scoring or review semantics.
- Stage 83 is visual/presentation-only. It does not change scoring, legality,
  snapping, route matching, shortest-route behavior, exercise semantics,
  backend schema, adaptive queue logic, attempt storage, or attempt review
  reasoning.

## Stage 84 Realistic Synthetic Exercise Map Fixtures

- Added eight fake-but-realistic Marlowe District route exercises for
  `/dev/route-runner`: central-grid, one-way-heavy, no-entry-heavy,
  prohibited-turn, restricted-road, checkpoint-order, efficiency-trap, and
  mixed-difficulty scenarios.
- Added a Stage 84 scenario catalogue with stable exercise ids, titles, area
  labels, difficulty, scenario tags, weak-area tags, road-name focus,
  restriction summaries, route rules, synthetic renderer metadata, map bounds,
  and current shortest-route distance estimates.
- The route runner exercise brief now surfaces the selected scenario, featured
  roads, restriction summary, ordered stop requirements, and scenario-specific
  rules while continuing to use the existing Marlowe synthetic map and runner
  APIs.
- The restricted-road scenario uses an existing `road_closed` fixture type for
  visual restricted-road training. This remains fixture/visual metadata only;
  Stage 84 does not add new road-closure legality enforcement.
- Stage 84 does not import London, OSM, Overpass, Mapbox routing, or external
  route data. It does not change scoring, legality, snapping, route matching,
  shortest-route behavior, backend schema, Supabase behavior, attempt review,
  adaptive queue semantics, or saved attempt shape.

## Stage 84.5 Immersive London-Inspired Practice Map Experience

- Enlarged `/dev/route-runner` into a map-first workspace. The route runner now
  opts into a wider app shell, makes the map the dominant full-width workspace,
  and moves the review and supporting panels underneath the map instead of
  squeezing the canvas with side rails.
- The synthetic map canvas now has a much larger desktop minimum height for
  route drawing and testing while preserving the existing canvas coordinate
  model, pointer handling, snapping, matching, scoring, and manual route input.
- Polished the fake Marlowe map renderer with a fictional station quarter,
  canal basin, goods-yard block, civic quarter, extra parkland, and clearer
  street hierarchy so it feels closer to a London route-planning practice map
  without importing or copying real London/OSM data.
- Stage 84.5 is UI/fixture/renderer polish only. It does not change scoring
  semantics, legality semantics, snapping, route matching, shortest-route
  behavior, backend schema, attempt review semantics, adaptive queue semantics,
  saved attempt shape, or exercise scoring data.

## Stage 85 Realistic Full-Size Map Rendering UI

- Increased the `/dev/route-runner` map canvas to a full-size atlas-style
  1120x760 drawing surface and gave the map panel the full available content
  width for route testing.
- Added pure visual renderer models for synthetic rail/context lines and
  landmark markers. These use existing Marlowe fixture landmarks and remain
  explicitly non-routable.
- The canvas renderer now draws layered map context: pale base, background
  areas, fictional rail approach, wider cased road hierarchy, landmark symbols,
  labels with stronger halos, route/restriction overlays, and larger numbered
  start/checkpoint/finish markers.
- The map is still fictional and London-inspired only. Stage 85 does not import
  OSM/Overpass/London data and does not change scoring logic, legality checks,
  snapping, route matching, shortest-route behavior, exercise semantics,
  restriction classification, backend/schema logic, adaptive practice logic,
  attempt history, or saved attempt shape.

## Stage 85.5 Continuous Route Drawing and Undo

- Updated `/dev/route-runner` drawing state from a single reset-on-draw trace to
  an immutable multi-stroke draft. Each pointer-down/move/up action is stored as
  one ordered stroke, and the existing drawn-route pipeline receives the
  flattened combined point sequence.
- Starting a second pointer action now appends to the current route instead of
  replacing it. Undo removes only the latest drawing stroke, while Clear drawing
  still resets the whole draft, overlays, score, and review state.
- The route map workspace now shows Undo next to Clear drawing. The raw orange
  drawing overlay renders strokes independently so nearby continuation strokes
  read as one route without forcing a large visual connector across accidental
  far-away restarts.
- Added a visual-only "Reveal fastest route" toggle beside the drawing controls.
  It uses the existing shortest legal route engine for the selected exercise,
  draws a blue dashed route overlay, and can be hidden again without modifying
  the learner's draft route, scoring, review, saved attempt, or adaptive
  practice state.
- Stage 85.5 is UI/draft-state only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, route exercise
  semantics, map fixture topology, restriction classification, backend/schema
  logic, Supabase logic, adaptive practice logic, attempt history, or saved
  attempt shape.

## Stage 85.6 Map Zoom Controls and Reset View

- Added map viewport controls to `/dev/route-runner`: Zoom in, Zoom out, and
  Reset view. The default reset returns the canvas to the same Stage 85 view
  shown when the selected exercise loads.
- Zoom is implemented as a visual viewport transform over the existing
  synthetic map coordinate system. User-drawn route strokes, snapped previews,
  matched overlays, restriction symbols, and the Stage 85.5 revealed fastest
  route all continue to render through the same zoomed viewport, so they remain
  aligned while zooming.
- Reset view changes only the viewport. It does not clear the learner's draft
  route, hide a revealed fastest route, change the selected exercise, or reset
  attempt review, saved attempts, adaptive practice, weak-area, or history
  state. Switching exercises still resets the viewport to the default view.
- Stage 85.6 is viewport/UI-only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, map fixtures,
  exercise semantics, backend/schema logic, Supabase logic, adaptive practice
  logic, attempt history, or saved attempt shape.

## Stage 85.7 Route Restriction Correctness Bug Fix

- Tightened the fastest-route/solution path so it is legal-only. The shortest
  route engine now blocks no-entry movements, one-way wrong-direction movement,
  prohibited turns, immediate U-turns, and modelled road-closed/restricted-road
  sections before returning a route.
- Added ordered-stop shortest-route search for multi-stop exercises. The search
  keeps previous-road state across checkpoints, so the solution cannot silently
  create an illegal U-turn or banned transition between independently calculated
  legs.
- The `/dev/route-runner` Reveal fastest route control now fails closed. If the
  required start, checkpoint, or finish sequence has no legal solution, the UI
  shows "No legal fastest route available for this exercise." and does not draw
  an illegal fallback route.
- Added legal reachability validation for route exercises. This flags invalid
  exercises whose required stops cannot be completed legally under current map
  restrictions. The current Marlowe no-entry focus exercise is treated as
  unavailable until the fixture is corrected instead of being shown as a valid
  legal solution.
- Directed restriction blocking is represented as `fromNodeId->toNodeId` edge
  keys and validated before a shortest route is returned for rendering. No-entry
  restrictions can also split a road at distance markers so a mid-road no-entry
  sign blocks only the illegal directed segment rather than the whole road.
- Stage 85.7 does not change scoring thresholds, map rendering style,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 86 Route Drawing Continuation and Undo UX

- Confirmed the `/dev/route-runner` drawing flow supports repeated drawing
  strokes: learners can release the pointer, click again, and continue the same
  route without losing earlier strokes.
- Added explicit map-workspace guidance beside the drawing controls:
  "Draw in multiple strokes. Release and click again to continue."
- Undo remains next to Clear drawing and removes only the latest stroke/action.
  Clear drawing still removes the full draft route and resets derived overlays,
  score, and review state.
- The review and scoring pipeline still receives the combined flattened route
  points from all strokes. Stage 86 does not change scoring, legality, snapping,
  matching, shortest-route behavior, map fixtures, exercise semantics, backend
  schema, Supabase logic, or route-engine semantics.

## Stage 87 Map Pan and Drag View Controls

- Added a Pan mode toggle to the `/dev/route-runner` map controls. With Pan mode
  on, left-drag moves the map view; with Pan mode off, left-drag continues to
  draw route strokes as before.
- The route-runner viewport state now tracks `zoom`, `panX`, `panY`, and
  `isPanModeEnabled`. Panning is clamped so the map cannot be dragged completely
  out of view, while still allowing useful movement when zoomed in.
- Pointer-to-map conversion now uses the same zoomed and panned viewport used
  for rendering. User-drawn routes, the revealed fastest route, stop markers,
  road labels, restriction symbols, and issue overlays remain aligned after
  both zooming and panning.
- Reset view restores the default zoom and pan without clearing the draft route
  or hiding a revealed fastest route. Switching exercise resets zoom, pan, and
  Pan mode to the default exercise view.
- Stage 87 is viewport/UI-only. It does not change scoring, legality, snapping,
  route matching, shortest-route algorithm behavior, restriction-engine
  semantics, map fixtures, exercise semantics, backend/schema logic, Supabase
  logic, adaptive practice logic, attempt history, or saved attempt shape.

## Stage 87.1 In-Map Map Controls UI Polish

- Moved the `/dev/route-runner` map controls into the map viewport so they feel
  attached to the drawing workspace instead of crowding the page header.
- Zoom now uses a compact in-map vertical control with `+` above `-`, a white
  face, subtle border, rounded corners, and shadow. The current zoom percentage
  remains visible as a small in-map badge.
- Pan mode, Undo, Clear drawing, Reveal/Hide fastest route, and Reset view now
  sit in a floating top-right map toolbar. Only the buttons capture pointer
  events, so the rest of the canvas remains drawable or pannable.
- Stage 87.1 is UI placement/styling only. It does not change route scoring,
  legality, snapping, route matching, shortest-route algorithm behavior,
  restriction-engine semantics, map fixtures, exercise semantics,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 88 Exercise Validity and Reachability Guard

- Added route-runner exercise availability validation that checks each selected
  exercise has a legal route through its required start, checkpoints, and
  finish before it is treated as a normal practice question.
- The validation uses the existing restriction-aware shortest-route logic. It
  respects no-entry restrictions, one-way direction rules, prohibited turns, and
  modelled road-closed/restricted-road sections without adding a second routing
  algorithm.
- Invalid exercises are now labelled in the `/dev/route-runner` selector as
  "Invalid - no legal route" and show a compact warning: "This exercise has no
  legal route and needs fixing." The known Marlowe no-entry focus exercise is
  currently detected as invalid/unrouteable.
- Reveal fastest route is disabled for invalid exercises, and drawn/manual route
  submission is blocked before scoring so an invalid fixture cannot be treated
  as a normal failed attempt. Drawing remains available for fixture debugging.
- Stage 88 does not change scoring logic, snapping, route matching,
  shortest-route algorithm behavior, restriction-engine semantics, map fixtures,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 89 Draw and Pan Interaction Modes

- Replaced the route-runner's single pan toggle with explicit `Draw` and `Pan`
  interaction modes inside the map viewport. `Draw` remains the default so route
  capture works immediately.
- In Draw mode, dragging adds multi-stroke route input and never pans the map.
  In Pan mode, dragging moves the map view and never creates route strokes.
- Switching modes preserves the current drawn route, fastest-route overlay,
  restriction overlays, markers, labels, zoom, and pan alignment.
- Cursor feedback now follows the active mode: crosshair for drawing and
  grab/grabbing for map panning.
- Stage 89 is UI interaction only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, no-entry or
  one-way enforcement, fixtures, backend/schema logic, Supabase logic, adaptive
  practice logic, attempt history, or saved attempt shape.

## Stage 90 Bounded Pan and Viewport Polish

- Tightened `/dev/route-runner` viewport pan bounds so the large synthetic map
  cannot be dragged endlessly into blank space.
- Pan limits are now explicit, zoom-aware, symmetrical, and safely clamped for
  zero or invalid viewport dimensions. Zooming out reclamps existing pan offsets
  back into the valid range.
- Reset view restores the default zoom, centred pan position, and Draw mode, and
  continues to clear temporary drag state in the UI.
- The pan margin is bounded by viewport size to avoid large empty gaps while
  still allowing useful movement when zoomed in.
- Stage 90 is viewport/UI polish only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, restriction
  semantics, map fixtures, adaptive practice logic, attempt storage, backend
  schema, Supabase logic, or exercise semantics.

## Stage 90.5 Route Runner Regression Lock

- Added focused regression coverage for the Stage 85-89 route-runner viewport
  behavior without adding new UI features.
- The tests lock draw/pan interaction intent, route-point alignment after
  zooming and panning, required stop marker alignment, road-restriction overlay
  alignment, and fastest-route overlay alignment.
- Existing drawing-trace and fastest-route tests continue to cover undo,
  clearing the full drawn route, and legal-only fastest-route reveal behavior.
- Stage 90.5 does not change scoring, legality, snapping, route matching,
  shortest-route algorithm behavior, exercise semantics, map fixtures,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 92 Route Matching Hardening

- Hardened route matching so same-road reversals are preserved as repeated road
  movements instead of being collapsed into invalid node sequences. This keeps
  loops, dead-end turn-backs, and repeated roads available for the existing
  legality/scoring layer to judge.
- Added additive matching debug output with high/medium/low/failed confidence,
  structured failure reasons, average/minimum snapped-point confidence, and
  matched route distance in metres.
- Added regressions for shaky and slightly off-road drawing, junction drawing,
  nearby parallel roads, multi-stroke draft scoring, disconnected rejection,
  off-road rejection, illegal route scoring, and legal-only fastest-route reveal.
- Stage 92 does not change scoring thresholds, legality rules, snapping
  tolerance policy, shortest-route behavior, exercise semantics, map fixtures,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 93 Scoring Calibration

- Centralised route-efficiency scoring in a pure `calculateRouteEfficiencyScore`
  helper used by `scoreRouteAttempt`.
- The calibrated score remains `shortest legal route distance / user route
  distance`, with the 80% pass mark preserved. Scores are rounded to one
  decimal place for display and capped at 100% when a user route is shorter
  than the calculated shortest route.
- Added safe handling for illegal routes, empty/zero-distance attempts, and
  missing shortest legal routes. Illegal movements still automatically fail
  before efficiency scoring.
- Added learner-facing grade bands: Excellent, Very good, Pass, Fail, and
  Automatic fail.
- Added stable scoring explanations for legal passes, legal-but-too-long
  failures, and restricted-movement failures so the route-runner review can
  explain the result consistently.
- Added regression examples for 1000/1000, 1000/1200, 1000/1250, 1000/1300,
  1000/5000, illegal attempts, empty routes, score clamping, grading bands, and
  explanation strings.
- Stage 93 does not change legality rules, snapping, route matching,
  shortest-route behavior, map fixtures, backend/schema logic, Supabase logic,
  adaptive practice logic, attempt history, or saved attempt shape.

## Stage 94 Multi-Stop Route Scoring

- Extended `scoreRouteAttempt` with a `legBreakdown` for ordered required stops
  such as A -> B, A -> B -> C, and A -> B -> C -> D.
- Each consecutive required-stop pair is scored as its own leg, with shortest
  legal distance, user route distance, extra distance, score percentage, grade,
  pass/fail state, failure reasons, and any legality violations for that leg.
- Overall scoring still uses the existing formula: total shortest legal
  required-route distance divided by the full user attempted distance.
- Illegal movement on any leg remains an automatic full-attempt fail, while
  missed or out-of-order checkpoints are reported as ordered-stop failures.
- Added internal per-leg minimum-score metadata support for future use without
  enforcing a new minimum-leg floor by default.
- `/dev/route-runner` now shows compact per-leg breakdown cards in the drawn
  attempt review and manual route result panels.
- Stage 94 keeps A -> B exercises working as before and does not change
  legality rules, one-way/no-entry/prohibited-turn enforcement, snapping,
  route matching, shortest-route algorithm behavior, map fixtures, backend
  schema, Supabase logic, adaptive practice logic, attempt history, or saved
  attempt shape.

## Stage 95 Attempt Storage

- Extended the route-runner attempt storage model with explicit map metadata,
  legal/illegal state, compact matched-route IDs, and Stage 94 per-leg
  breakdown payloads.
- Supabase-backed attempts now store `map_id`, `map_version`,
  `exercise_version`, `is_legal`, and `per_leg_breakdown` alongside the
  existing score, pass/fail, distance, violation, recommendation, matched-route,
  review payload, schema version, and created-at fields.
- Added local device fallback storage for `/dev/route-runner` attempts when
  Supabase is unavailable or a save fails, so anonymous/dev practice can keep
  working without blocking scoring feedback.
- Matched-route storage is intentionally compact: road IDs, node IDs, required
  stop IDs, and directed edge IDs are kept, while large matcher diagnostics and
  raw drawing traces are not saved.
- Saved attempt history can read from Supabase when available or local fallback
  attempts when Supabase is not configured or temporarily unavailable.
- Stage 95 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, map fixtures, dashboards, OSM import, or
  exercise semantics.

## Stage 96 Attempt History Review

- Added a pure saved-attempt review builder for `/dev/route-runner` that turns
  stored attempt rows into structured learner-facing review sections.
- Saved history rows now show date, exercise title or id, score, pass/fail,
  legal/illegal state, user route distance, shortest route distance, and failure
  reason.
- Selecting a saved attempt now opens a structured review with user-route
  summary, shortest-route summary, score explanation, violations, missed
  restrictions, and Stage 94 per-leg breakdowns when available.
- The saved review panel handles stale or missing exercise titles safely by
  falling back to the saved exercise id and showing a compact warning.
- Saved-attempt visual replay is intentionally deferred; saved attempts
  currently show a textual route summary from compact stored road/node/directed-
  edge IDs, with the raw saved review payload retained in a collapsible debug
  section.
- Stage 96 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, storage serialization semantics, backend
  schema, OSM import, dashboards, or exercise semantics.

## Stage 97 Route Replay

- Added pure route replay helpers for normalising route geometry, calculating
  replay length and duration, interpolating marker positions along polylines,
  clamping progress, resetting replay state, switching replay modes, and
  building compare-mode markers.
- `/dev/route-runner` now shows compact replay controls after a drawn attempt is
  reviewed: replay my route, replay the shortest legal route, compare both,
  play, pause, restart, and 0.5x/1x/2x speed selection.
- Replay markers are drawn in map coordinates on the existing canvas, using the
  same viewport transform as roads, stops, restriction icons, the snapped route,
  and the revealed fastest route, so they stay aligned after zoom, pan, and reset
  view.
- Replay state is isolated from scoring, pass/fail, attempt storage, saved
  history, matched route data, shortest-route data, adaptive practice, and weak-
  area analytics. Starting a new drawing, undoing, clearing, or changing
  exercises safely resets only replay playback.
- Empty or missing geometry disables the relevant replay mode instead of
  crashing. Compare mode is available when both snapped user-route geometry and
  the legal shortest-route geometry exist. Saved-attempt visual replay remains a
  future layer because saved rows intentionally store compact IDs rather than raw
  drawing payloads.
- Stage 97 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, map fixtures, backend schema, OSM import,
  storage semantics, attempt history, or exercise semantics.

## Stage 98 Weak Area Analytics Upgrade

- Added a pure saved-attempt weak-area analytics helper for
  `/dev/route-runner` that consumes stored attempt records without requiring
  Supabase during dev testing.
- The analytics summary detects repeated one-way, no-entry, prohibited-turn,
  restricted-road, disconnected/off-road drawing, missed-checkpoint,
  checkpoint-order, inefficient-route, long-route, road-specific, and
  junction-specific weakness signals where the saved review data contains them.
- Weak areas are ranked by frequency with recent-attempt weighting, and the
  saved attempt panel now shows learner-friendly messages, practice focus, and
  an improving/stable/getting-worse trend when enough saved attempts exist.
- Existing adaptive practice helpers still consume their current signals; Stage
  98 adds an additional saved-history summary rather than replacing the
  Stage 74-79 recommendation flow.
- Stage 98 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, storage schema, Supabase requirements,
  OSM import, dashboards, or exercise semantics.

## Stage 100 Performance Hardening

- Added a pure route-runner performance helper for graph memoization,
  large-trace budgeting, and active-drawing pipeline placeholders.
- `/dev/route-runner` now builds the Marlowe map graph once per component
  lifecycle and reuses it for exercise reachability checks and fastest-route
  reveal, avoiding repeated graph rebuilds in the dev UI.
- Active pointer drawing now keeps the UI responsive by rendering the raw trace
  while deferring snap, match, scoring, and debug overlay rebuilding until the
  stroke is finished.
- Very large completed traces are defensively simplified and capped before the
  drawn-route pipeline runs, preserving endpoints while preventing accidental
  huge pointer traces from overwhelming snapping/matching.
- Stage 100 keeps the existing debug panels and map overlays, but avoids
  recalculating expensive derived route data on every pointer move.
- Stage 100 does not change scoring rules, legality checks, snapping semantics,
  route matching semantics, shortest-route behavior, map fixtures, backend
  schema, Supabase logic, OSM import, or adaptive practice behavior.

## Stage 101 Overpass / OSM Import Prototype

- Added an isolated `lib/map-engine/osm` import prototype for minimal Overpass
  JSON responses, covering node, way, and relation elements while ignoring
  relations for Stage 101 graph conversion.
- `parseOverpassRoadExtract()` extracts accepted road-like highway ways
  (`primary`, `secondary`, `tertiary`, `unclassified`, `residential`,
  `service`, and `living_street`) into a deterministic prototype road shape
  with OSM IDs, names, highway type, direction metadata, coordinates, node
  references, and raw tags retained for debugging.
- Motorways, trunk roads, footways, cycleways, paths, pedestrian-only ways,
  steps, bridleways, construction/proposed ways, buildings, railways,
  waterways, blocked access roads, and ways with missing node references are
  excluded rather than routed through.
- Basic OSM direction and access tags are detected: `oneway=yes`, `true`, `1`,
  `-1`, and `junction=roundabout`; `access=no`, `motor_vehicle=no`, and
  `vehicle=no` are treated as blocked for this prototype.
- Added a tiny committed London-like Overpass fixture with named roads,
  one-way and reverse-one-way cases, a roundabout, blocked vehicle access, and
  excluded non-drivable ways. Tests use this fixture only and do not call live
  Overpass.
- For manual dev experiments, use a small Overpass Turbo query like:

```overpassql
[out:json][timeout:25];
(
  way["highway"~"^(primary|secondary|tertiary|unclassified|residential|service|living_street)$"](51.529,-0.126,51.534,-0.117);
);
(._;>;);
out body;
```

  Keep downloaded extracts small and committed fixtures synthetic or minimal
  enough for deterministic tests.
- Existing Marlowe/fake/dev maps remain the default. Stage 101 does not render
  OSM data, create OSM exercises, call external routing APIs, or change scoring,
  legality, snapping, matching, shortest-route, backend, or Supabase behavior.
- Future OSM-derived UI must include OpenStreetMap contributor attribution.
  Stage 102 is expected to convert this parsed output into the app graph format.

## Stage 102 OSM Import to Route Graph Converter

- Added a pure Stage 102 converter that consumes Stage 101 imported Overpass
  output and emits the existing `MapDefinition` shape used by snapping,
  legality, shortest-route, reveal-fastest-route, scoring, and route-exercise
  code.
- OSM node coordinates are projected into deterministic local x/y metres using
  a small-extract bbox-centred projection, with origin, scale, lat/lon bounds,
  and projected bounds retained in converter metadata for debugging.
- Imported OSM ways are split into one internal road segment for each
  consecutive OSM node pair. Stable ids use `osm-node-{id}` and
  `osm-way-{id}-segment-{index}`, preserving road names, OSM ids, highway tags,
  original OSM direction, segment index, node ids, and raw tags for Stage 103
  rendering/debug work.
- The converter default road filter includes `primary`, `primary_link`,
  `secondary`, `secondary_link`, `tertiary`, `tertiary_link`, `residential`,
  `unclassified`, `living_street`, `service`, and `road`; it excludes footways,
  cycleways, paths, steps, pedestrian-only/platform/construction/proposed ways,
  and remains configurable for later London tuning.
- One-way OSM data is represented using existing map-engine semantics:
  `oneway=yes`, `true`, `1`, and roundabouts become one-way generated segments;
  `oneway=-1` reverses generated segment endpoints so existing directed-edge
  routing only permits the legal direction. Stage 101 blocked-access ways remain
  excluded, while imported roads with vehicle-blocking tags are converted with
  `road_closed` restrictions.
- The tiny Stage 101 fixture now converts into an internal route map that can be
  passed through the existing shortest-route and legality engines. Tests prove
  one-way, reverse-one-way, roundabout, missing-node, non-road filtering,
  deterministic projection, and converted shortest-route behavior.
- Stage 102 does not fetch live OSM data, render London maps, create exercises,
  change scoring behavior, change drawing behavior, change snapping/matching
  behavior, or alter shortest-route legality rules beyond consuming the
  converted one-way/restricted road data through existing engine paths.

## Stage 103 Render Converted OSM Route Graph in Route Runner

- Added a dev-only route-runner map catalogue that keeps the Marlowe synthetic
  map as the default and adds the converted Stage 101 tiny London OSM fixture as
  an explicit selectable map option.
- `/dev/route-runner` now derives exercise lists, map graph, viewport bounds,
  restriction overlays, drawing/snapping/scoring inputs, fastest-route reveal,
  and canvas labels from the selected `MapDefinition` instead of assuming the
  Marlowe fixture.
- The converted OSM fixture renders through the existing canvas street-map path
  with Stage 102 projected coordinates. Road labels use preserved OSM road names,
  and display styling reads preserved highway metadata for primary, secondary,
  tertiary, residential, service, and fallback roads.
- Added simple dev OSM fixture exercises so drawing, snapping, panning, zooming,
  reset view, restriction display, and reveal-fastest-route can be manually
  tested against converted graph data without fetching live Overpass data.
- Stage 103 is integration/rendering only: it does not replace the fake/dev
  maps, call live OSM or external routing APIs, alter scoring, alter
  shortest-route behavior, change legality semantics, require Supabase, or wire
  imported OSM data into production UI.

## Stage 104 Converted OSM Exercise Fixtures and Solvability Validation

- Added several dev-only route exercises on top of the converted Stage 102 OSM
  fixture map: a simple start-to-finish route, a checkpoint route, a roundabout
  checkpoint route, a one-way-aware route from the roundabout to Argyle Street,
  and an isolated service-lane route.
- Converted OSM exercise stops use stable converted graph node ids such as
  `osm-node-1001`, so markers align with the rendered roads, snapping graph,
  and fastest-route overlay without arbitrary screen-coordinate fixtures.
- Added regression coverage proving the converted OSM exercises are registered
  only under the converted OSM route-runner map option while the synthetic
  Marlowe map remains the default.
- Added solvability validation for every converted OSM exercise using the
  existing restriction-aware shortest-route and exercise reachability helpers.
  Tests fail if any fixture requires illegal one-way/no-entry/restricted-road
  movement or has an unreachable checkpoint/finish.
- Added fastest-route reveal coverage for every converted OSM exercise. Returned
  edge sequences are validated with the existing directed-edge path validation
  before being accepted as renderable route overlays.
- Added a negative unreachable converted-OSM exercise test to prove invalid
  fixtures are rejected instead of being silently treated as normal practice
  questions.
- Stage 104 does not fetch live OSM/Overpass data, hard-code route solutions,
  bypass the route engine, change scoring, change legality, alter snapping,
  modify shortest-route behavior, replace synthetic fixtures, or expose OSM maps
  outside the dev route-runner flow.

## Stage 105 Medium London OSM Fixture Import

- Added a committed dev/test-only `mediumLondonOverpass.json` fixture under
  `lib/map-engine/osm/fixtures`. It is a deterministic, generated
  Overpass-like extract inspired by the King's Cross, Euston, and Bloomsbury
  street pattern, with multiple junctions, one-way streets, a roundabout,
  excluded foot/cycle/trunk ways, and a blocked private service way.
- The medium fixture is parsed and converted through the existing Stage 101/102
  OSM import pipeline into a normal `MapDefinition`. It currently produces 25
  converted graph nodes and 48 converted road segments, larger than the tiny
  prototype while remaining compact enough for unit tests and local dev.
- `/dev/route-runner` now exposes the medium converted OSM map as a separate
  selectable dev map. The Marlowe synthetic map remains the default, and the
  tiny converted OSM fixture remains available as its own option.
- Added five dev-only medium OSM exercises using stable converted graph node
  stops. The exercises cover simple start/finish routing, a one-way street, a
  checkpoint route, a one-way-aware detour, and a service-road route.
- Added parser, converter, route-runner selection, marker attachment,
  solvability, and reveal-fastest-route legality tests for the medium fixture.
  Revealed routes are validated against the existing directed-edge path
  validation and must not travel illegally against imported one-way rules.
- To replace this fixture later, commit a similarly small trimmed Overpass JSON
  extract, keep node/way ids stable, and run the parser/converter and
  route-runner map tests before adding exercises. Tests must not fetch live
  Overpass data.
- Stage 105 does not fetch live OSM/Overpass data, replace synthetic maps, use
  external routing APIs, hard-code solution routes, change scoring, change
  legality, alter snapping, modify shortest-route/reveal-fastest-route logic,
  or change backend/Supabase behavior.

## Stage 106 Medium OSM Map Visual QA / Debug Overlay

- Added a dev-only OSM graph QA overlay for `/dev/route-runner`. The overlay is
  available only when a converted OSM map is selected, is off by default, and
  does not appear for the default Marlowe synthetic map.
- To inspect the medium fixture, open `/dev/route-runner`, select `Medium
  converted OSM fixture`, then use the in-map `OSM QA` button or the converted
  OSM QA panel below the map to enable the graph overlay.
- When enabled, the overlay draws graph nodes, directed graph edges, one-way
  direction arrows, and optional node/road-segment IDs using the same map
  coordinate transform as roads, restrictions, drawn routes, fastest-route
  reveal, replay markers, and exercise stops. This keeps the QA layer aligned
  while zooming, panning, and resetting the view.
- Added a compact converted OSM QA summary panel with map id/name, source
  fixture name, node count, road segment count, directed edge count, one-way and
  two-way segment counts, selected exercise id/title, and start/checkpoint/finish
  node ids.
- Added deterministic helper tests for default-off state, converted-map-only
  availability, medium fixture debug counts, hidden overlay behavior, visible
  graph node/edge models, and tiny-vs-medium debug summary differences.
- Stage 106 is visual/debug-only. It does not fetch live OSM/Overpass data,
  change scoring, alter legality, modify snapping or matching, change
  shortest-route/reveal-fastest-route logic, touch saved attempts, analytics,
  Supabase, or replace the default synthetic map.

## Stage 107 Medium OSM Visual Fixture QA Fixes

- Improved the first-load fit for the medium converted OSM fixture in
  `/dev/route-runner`. The medium map now uses a larger deterministic viewport
  padding so roads and exercise stops are not tight against the canvas edge on
  initial load. The default synthetic map and tiny converted OSM fixture keep
  their existing fit behavior.
- Polished the dev-only OSM QA overlay for the medium fixture: graph nodes are
  smaller, two-way debug edges are lighter dashed guides, one-way edges remain
  clearer, and dense two-way arrowheads are suppressed for medium maps. Optional
  node/segment IDs remain off by default and only appear when explicitly
  enabled.
- Expanded the converted OSM QA panel with source kind, blocked OSM way count,
  map extent, bounds centre, and blocked OSM way IDs, while keeping selected
  exercise and start/checkpoint/finish node IDs visible for fixture inspection.
- The overlay continues to draw below routes, restriction focus highlights,
  replay markers, and start/checkpoint/finish markers so exercise markers remain
  readable while QA mode is enabled.
- Added deterministic tests for medium fixture fit bounds, QA summary bounds and
  extent, blocked-way metadata, medium overlay style, and default-hidden ID
  behavior.
- Stage 107 is dev-only visual QA polish. It does not fetch live OSM/Overpass
  data, change scoring, alter legality, modify snapping or matching, change
  shortest-route/reveal-fastest-route logic, touch saved attempts, analytics,
  Supabase, or replace the default synthetic map.

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
- Footer bottom copy uses `© 2026 TopoPass. All rights reserved.`
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
