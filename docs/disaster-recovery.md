# PCO Ready Disaster Recovery Runbook

Use this runbook to recover the live PCO Ready service at
`https://pcoready.co.uk`. It covers source control, AWS/Terraform, EC2, ECR,
Docker, Caddy, Cloudflare, managed Supabase, Mapbox, Zoho Mail, monitoring, and
post-recovery checks.

This is an operator runbook. Commands that create, replace, restore, or point
production resources must be reviewed before they are run. Never paste secret
values into Git, Terraform variables, terminal screenshots, issues, or logs.

## Current production architecture

```text
Learner
  |
  v
Cloudflare DNS/CDN for pcoready.co.uk
  |
  v
AWS Elastic IP -> EC2 security group (80/443 only)
  |
  v
Caddy container -> Next.js app container on private Docker port 3000
                         |
                         +-> Managed Supabase project
                         +-> Mapbox public API

GitHub main branch -> GitHub Actions -> private Amazon ECR -> EC2 image pull
```

- Fasthosts is the registrar only.
- Cloudflare is authoritative for DNS and redirects.
- Route 53 must remain disabled.
- Supabase is managed by Supabase; it is not running on EC2.
- Zoho Mail handles email for `pcoready.co.uk` only.
- Legacy internal identifiers such as `topopass`, `/srv/topopass`, container
  names, AWS tags, and the ECR image name are intentionally still in use. They
  are operational identifiers, not the public brand.

## Start here: choose the recovery path

| Symptom | Recovery path |
| --- | --- |
| Site is down but EC2 is running | [Recover the existing host](#recover-the-existing-host) |
| EC2 was stopped | Start it, wait for SSM, then recover the existing host |
| EC2 root disk or instance was lost, but Terraform state/AWS account remain | [Replace the EC2 host](#replace-the-ec2-host) |
| AWS resources or account must be recreated | [Full rebuild](#full-rebuild) |
| Supabase is the only failed component | [Recover managed Supabase](#recover-managed-supabase) |
| DNS, HTTPS, or email failed | [Restore Cloudflare and Zoho](#restore-cloudflare-and-zoho) |

Before changing anything, record the incident time, current DNS answers,
container status, last known healthy deployment, and whether learner writes
may have occurred. Preserve surviving disks, state files, snapshots, database
exports, and logs.

## Sources of truth and critical files

| Area | Source of truth | Repository location |
| --- | --- | --- |
| Application code | GitHub `main` and immutable commit history | Repository root |
| Terraform root | Git plus a separately protected state file | [`infra/terraform`](../infra/terraform) |
| Terraform values | Private operator copy; never Git | `infra/terraform/terraform.tfvars` |
| AWS host bootstrap | Git | [`infra/terraform/user_data.sh.tftpl`](../infra/terraform/user_data.sh.tftpl) |
| Production containers | Git | [`deploy/docker-compose.prod.yml`](../deploy/docker-compose.prod.yml) |
| HTTPS proxy | Git plus host-only domain env | [`deploy/Caddyfile`](../deploy/Caddyfile) |
| App runtime config | AWS Secrets Manager or host-only file | `/srv/topopass/env/app.env` |
| Proxy runtime config | Host-only file | `/srv/topopass/env/proxy.env` |
| Image build/publish | GitHub Actions configuration | [`.github/workflows/docker-publish-ecr.yml`](../.github/workflows/docker-publish-ecr.yml) |
| Database schema/RLS | Git | [`supabase/migrations`](../supabase/migrations) |
| Learner/account data | Managed Supabase plus off-site logical exports | Supabase project and protected backup storage |
| DNS/CDN/redirects | Cloudflare account | Cloudflare dashboard/export |
| Domain ownership | Fasthosts account | Fasthosts dashboard |
| Mailboxes and DKIM value | Zoho Mail account | Zoho Admin Console |

The Git repository deliberately does **not** contain:

- Terraform state or `terraform.tfvars`
- AWS credentials
- the value of the Secrets Manager secret
- real `.env` files
- Supabase database passwords or private keys
- the GitHub OIDC role configuration
- Cloudflare credentials or the current Zoho DKIM value
- learner/account data

## Recovery information to keep outside Git

Store these items in an encrypted password manager or protected backup vault,
with access available to at least two authorised operators:

- GitHub recovery access and repository URL
- AWS account ID, administrator recovery access, and production region
- a current encrypted Terraform state backup
- the private `terraform.tfvars` values or a reviewed reconstruction record
- Cloudflare, Fasthosts, Supabase, Zoho, Mapbox, and email recovery access
- Supabase project reference, database password, current project URL, and anon
  key; keep privileged keys separately
- current GitHub Actions variable names and the OIDC role ARN
- regular managed Supabase logical exports and a restore-test record
- a Cloudflare DNS export or screenshots of every DNS and redirect rule
- the current ECR repository name and a known-good image commit SHA

## Recover the existing host

Use this path when Terraform, the EC2 instance, Elastic IP, and managed
Supabase project still exist.

### 1. Connect through SSM

From a machine with AWS CLI access and the Terraform state:

```powershell
terraform -chdir=infra/terraform output ssm_session_command
```

Run the printed command. If the state is unavailable, open AWS Systems Manager
in `eu-west-2`, choose **Session Manager**, and start a session with the
production instance.

SSH is disabled by default. Do not open port 22 to the world as a recovery
shortcut.

### 2. Inspect without deleting anything

```bash
sudo systemctl status docker --no-pager
sudo systemctl status topopass-compose.service --no-pager
sudo docker ps -a
sudo docker compose -f /srv/topopass/deploy/docker-compose.prod.yml ps -a
sudo docker compose -f /srv/topopass/deploy/docker-compose.prod.yml logs --tail 100 app
sudo docker compose -f /srv/topopass/deploy/docker-compose.prod.yml logs --tail 100 caddy
sudo mountpoint /srv/topopass-data
```

The production Compose command must include
`-f /srv/topopass/deploy/docker-compose.prod.yml`. Running plain
`docker compose` from `/srv/topopass` can select the development Compose file
and incorrectly look for `.env.docker`.

### 3. Restore the repository checkout if needed

```bash
sudo mkdir -p /srv/topopass
sudo chown ubuntu:ubuntu /srv/topopass
git clone https://github.com/mapperguy2013/topopass.git /srv/topopass
cd /srv/topopass
git switch main
git pull --ff-only
```

If the directory is already a valid checkout, do not clone over it. Run only
the final three commands. A private repository requires an approved deploy key
or short-lived GitHub authentication; never store a personal token in the
repository.

### 4. Restore runtime configuration

When AWS Secrets Manager is enabled, fetch the app env file:

```bash
cd /srv/topopass
sudo bash infra/deploy/fetch-runtime-env.sh
sudo test -s /srv/topopass/env/app.env
```

Create or restore `/srv/topopass/env/proxy.env` with:

```dotenv
APP_DOMAIN=pcoready.co.uk
WWW_DOMAIN=www.pcoready.co.uk
ACME_EMAIL=admin@pcoready.co.uk
```

The app secret must be plain dotenv text, not JSON. Its required shape is:

```dotenv
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SITE_URL=https://pcoready.co.uk
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_PUBLIC_MAPBOX_TOKEN
```

Keep both host files root-owned and unreadable by other users:

```bash
sudo chown root:root /srv/topopass/env/app.env /srv/topopass/env/proxy.env
sudo chmod 600 /srv/topopass/env/app.env /srv/topopass/env/proxy.env
```

### 5. Pull and restart the production stack

```bash
cd /srv/topopass
sudo bash infra/deploy/deploy-ec2-compose.sh
sudo docker compose -f deploy/docker-compose.prod.yml ps
```

If deployment fails, check the app log first. Caddy deliberately waits for the
app health check, so an unhealthy app also leaves Caddy unstarted.

### 6. Restore boot-time startup

```bash
cd /srv/topopass
sudo cp infra/deploy/systemd/topopass-compose.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now topopass-compose.service
sudo systemctl status topopass-compose.service --no-pager
```

Finish with the [end-to-end validation](#end-to-end-validation).

## Replace the EC2 host

Use this only when the EC2 instance/root volume must be replaced but the
original AWS account and valid Terraform state still exist.

1. Confirm the persistent data EBS volume and all useful snapshots still
   exist. Do not delete the failed host until evidence and recoverable files
   have been collected.
2. Back up the current Terraform state securely.
3. Run `terraform plan` and confirm the proposed replacement does not destroy
   the Elastic IP, persistent data volume, backup bucket, or unrelated
   resources.
4. If Terraform does not already detect a missing instance, explicitly plan a
   replacement only after the root disk has been declared unrecoverable:

   ```powershell
   terraform -chdir=infra/terraform plan -replace=aws_instance.app
   terraform -chdir=infra/terraform apply -replace=aws_instance.app
   ```

5. Confirm the outputs and wait for cloud-init/user-data to install Docker,
   mount `/srv/topopass-data`, and configure CloudWatch:

   ```powershell
   terraform -chdir=infra/terraform output
   terraform -chdir=infra/terraform output ssm_session_command
   ```

6. Connect through SSM and follow [Recover the existing
   host](#recover-the-existing-host), starting at the repository checkout.
7. Confirm the Elastic IP. If it changed, update the Cloudflare apex and `www`
   records using the new `terraform output -raw elastic_ip` value.

The repository and Docker data live primarily on the EC2 root volume. The
separate EBS data volume is mounted at `/srv/topopass-data`; it does not by
itself restore the Git checkout, Docker images, Caddy named volumes, or host
env files.

## Full rebuild

Use this path for a clean AWS rebuild or when all original compute resources
are gone.

### 1. Restore accounts and operator tools

Recover access to GitHub, AWS, Cloudflare, Fasthosts, Supabase, Zoho, Mapbox,
and the administrator email account. Enable MFA before returning the service
to production.

Install locally:

- Git
- Terraform 1.6 or later
- AWS CLI v2
- Node.js 22 if local validation is required
- Supabase CLI when the database must be recreated or exported

Configure AWS CLI for `eu-west-2`, then verify the account before making
changes:

```powershell
aws sts get-caller-identity
aws configure get region
```

### 2. Recover the Git repository

```powershell
git clone https://github.com/mapperguy2013/topopass.git
Set-Location topopass
git switch main
git pull --ff-only
```

Use a known-good commit if the current branch is part of the incident. Record
the chosen commit SHA.

### 3. Decide how Terraform state will be recovered

The current Terraform root has no remote backend block and therefore uses
local state unless an operator supplied a backend separately.

- If AWS resources still exist, recover the original state or import every
  surviving resource. **Do not run a clean `terraform apply` over existing
  infrastructure with an empty state.** That can create duplicates, naming
  conflicts, or destructive drift.
- If the old infrastructure is confirmed gone, initialise a clean state and
  rebuild.
- Before a new production apply, prefer an encrypted, versioned, access-
  controlled remote state backend. Backend creation and migration are not
  automated by this repository.

Never commit state. State can contain infrastructure metadata and must be
protected even though application secret values are excluded from Terraform.

### 4. Recreate Terraform variables

Terraform is located at [`infra/terraform`](../infra/terraform). Start from the
committed example:

```powershell
Copy-Item infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

For the current design, confirm at least:

```hcl
project_name = "topopass"
environment  = "production"
aws_region   = "eu-west-2"

instance_type       = "t3.small"
root_volume_size_gb = 30
data_volume_size_gb = 50

allowed_http_cidr_blocks      = ["0.0.0.0/0"]
allowed_http_ipv6_cidr_blocks = []
ssh_cidr_blocks               = []
key_name                      = null

vpc_id           = null
public_subnet_id = null

domain_name                        = "pcoready.co.uk"
enable_route53_records              = false
enable_supabase_gateway_dns         = false

enable_runtime_secrets_manager = true
runtime_secret_name            = "topopass/production/app-env"

enable_ec2_schedule   = true
ec2_stop_time         = "02:00"
ec2_start_time        = "09:00"
ec2_schedule_timezone = "Europe/London"
```

Use the full example for backup retention, monitoring, alert email, budget,
and tagging values. `terraform.tfvars` may contain non-secret infrastructure
settings only.

When `vpc_id` and `public_subnet_id` are `null`, Terraform creates:

- VPC `10.42.0.0/16`
- public subnet `10.42.1.0/24`
- internet gateway and a `0.0.0.0/0` public route
- a security group with public TCP 80 and 443
- no public SSH unless a trusted CIDR is explicitly supplied

The app port `3000`, Postgres, Supabase Studio, and database/API ports must not
be opened publicly.

### 5. Create or restore ECR and GitHub OIDC

Terraform does not create the private ECR repository or GitHub's AWS publishing
role. In a clean AWS account, create the ECR repository first:

```powershell
aws ecr create-repository --repository-name topopass-web --region eu-west-2
```

In AWS IAM, create or confirm the GitHub OIDC provider:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Create a role restricted to the repository and production branch. Its trust
condition should match:

```text
repo:mapperguy2013/topopass:ref:refs/heads/main
```

Grant only the ECR authentication and image-push actions used by
`.github/workflows/docker-publish-ecr.yml`. Record the role ARN.

If the AWS account or ECR URL changed, update every old account-specific
registry reference before deploying:

```powershell
rg "006419716542|dkr\.ecr" deploy infra .github docs
```

The current defaults are account-specific in:

- `deploy/docker-compose.prod.yml`
- `infra/deploy/deploy-ec2-compose.sh`
- `infra/deploy/update`

The systemd service uses the Compose default after reboot, so a temporary shell
environment override is not sufficient for a permanent account migration.

### 6. Recreate or verify managed Supabase

If the existing project survived, keep it and record its project URL and anon
key. If it was lost, follow [Recover managed Supabase](#recover-managed-supabase)
before building the production image.

### 7. Configure GitHub Actions

In GitHub, open **Settings -> Secrets and variables -> Actions**.

Repository variables:

```text
AWS_REGION=eu-west-2
AWS_ROLE_TO_ASSUME=<GitHub OIDC role ARN>
ECR_REPOSITORY=topopass-web
NEXT_PUBLIC_SITE_URL=https://pcoready.co.uk
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_MAPBOX_TOKEN=<public Mapbox token>
```

Repository secret:

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public Supabase anon key>
```

The anon key is browser-visible by design, but the workflow currently reads it
from GitHub Secrets. Never substitute a Supabase service-role or secret key.

`NEXT_PUBLIC_*` values are compiled into the Next.js browser bundle. Changing
only `/srv/topopass/env/app.env` does not update an existing image; change the
GitHub build settings and build a new image as well.

Push a reviewed commit to `main` or manually run **Publish Docker image to
Amazon ECR**. Confirm both the commit-SHA tag and `latest` exist in ECR.

### 8. Apply Terraform

```powershell
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
$PlanFile = Join-Path $env:TEMP "pcoready-recovery.tfplan"
terraform -chdir=infra/terraform plan -out=$PlanFile
terraform -chdir=infra/terraform apply $PlanFile
Remove-Item -LiteralPath $PlanFile
```

Review the plan before apply. It should create or restore the EC2 host, EBS
data volume, Elastic IP, security group, IAM/SSM access, monitoring, SNS,
budget resources, backup bucket/snapshot policy, runtime-secret metadata, and
optional EC2 schedules. It must not create Route 53 records.

Record these outputs securely:

```powershell
terraform -chdir=infra/terraform output instance_id
terraform -chdir=infra/terraform output -raw elastic_ip
terraform -chdir=infra/terraform output ssm_session_command
terraform -chdir=infra/terraform output backup_bucket_name
terraform -chdir=infra/terraform output runtime_secret_name
```

Terraform creates only the Secrets Manager secret metadata. It does not add a
secret value and it does not start the production containers.

### 9. Populate Secrets Manager

Open AWS Secrets Manager in `eu-west-2`, select
`topopass/production/app-env`, and add the plain dotenv content shown in
[Restore runtime configuration](#4-restore-runtime-configuration). Do not use
JSON. Do not add AWS credentials or a Supabase privileged key.

### 10. Bootstrap and deploy EC2

Wait for user-data/cloud-init and SSM to become ready. Connect with the
Terraform SSM output, then follow [Recover the existing
host](#recover-the-existing-host), starting with the repository checkout.

Confirm:

```bash
sudo cloud-init status --wait
sudo tail -n 100 /var/log/topopass-user-data.log
sudo mountpoint /srv/topopass-data
docker --version
docker compose version
aws sts get-caller-identity
```

### 11. Restore Cloudflare and certificates

Follow [Restore Cloudflare and Zoho](#restore-cloudflare-and-zoho). Always use
the new Terraform `elastic_ip` output; do not copy an obsolete address from an
old screenshot or cutover document.

### 12. Restore monitoring and schedules

- Confirm both SNS email subscriptions from the recipient inboxes.
- Confirm CloudWatch instance-status, CPU, memory, and disk alarms have data.
- Confirm Caddy, deploy, user-data, syslog, and backup log groups receive logs.
- Review the AWS Budget amount before re-enabling any kill switch.
- Confirm the EventBridge start/stop times are appropriate. The defaults stop
  at `02:00` and start at `09:00` in `Europe/London`.
- Confirm `topopass-compose.service` starts the site after an EC2 reboot.

Finish with [End-to-end validation](#end-to-end-validation).

## Recover managed Supabase

AWS recovery does not restore managed Supabase. The application currently uses
one hosted Supabase project for authentication and persisted learner/admin
data.

### If the existing project still exists

1. Open the project and check **Database -> Backups** for an available restore
   point. A restore causes downtime; select the closest safe point before the
   incident.
2. If no database restore is required, check **Project Settings -> API Keys**
   and record the project URL and public anon key.
3. Under **Authentication -> URL Configuration**, set:

   ```text
   Site URL: https://pcoready.co.uk
   Redirect URL: https://pcoready.co.uk/auth/callback
   Local development redirect, if needed: http://localhost:3000/**
   ```

4. Confirm email/password sign-in settings and any customised mail templates.
5. Update GitHub Actions and the AWS runtime secret if the URL or anon key
   changed, then rebuild the Docker image.

Supabase recommends exact production redirect paths. See the official
[redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

### If a new project must be created

1. Create one managed Supabase project; a separate project for EC2 is not
   required.
2. Save the database password in the protected operator vault.
3. Choose one database recovery path:
   - If a verified roles/schema/data export exists, restore that export by
     following Supabase's current
     [backup/restore guidance](https://supabase.com/docs/guides/platform/backups).
     Test it away from production first. Do not first apply the committed
     schema on top of an export that already contains the schema.
   - If no export exists, link the repository and rebuild the empty schema from
     the committed migrations:

     ```powershell
     supabase login
     supabase link --project-ref YOUR_PROJECT_REF
     supabase db push --dry-run
     supabase db push
     ```

4. If no data export exists, the committed migrations can rebuild schema,
   functions, and RLS policies, but they cannot recreate learner accounts,
   attempts, progress, feedback, or other production rows.
5. Configure Auth URL settings, obtain the new project URL/anon key, update
   GitHub Actions and Secrets Manager, then rebuild and redeploy the app.
6. Verify RLS, admin profiles, sign-up, login, password recovery, progress
   persistence, newsletter signup, and admin access.

The migration source is [`supabase/migrations`](../supabase/migrations). The
committed `supabase/seed.sql` is currently only a placeholder. Question-bank
content is separately stored in
[`supabase/seed/question_bank_items.json`](../supabase/seed/question_bank_items.json)
and must be seeded only through the guarded admin workflow after schema and
admin access are verified.

### Required Supabase backup protection

PCO Ready currently uses the Supabase Free plan. Supabase recommends that Free
projects create regular CLI database exports and keep them off-site; automatic
daily backups are a paid-plan feature. The AWS backup bucket and EBS snapshots
in this repository do not back up the managed Supabase project.

At a minimum, schedule protected exports of roles, schema, and data using the
current Supabase guidance. Run this from outside the Git checkout. The example
keeps the connection string out of the typed command history, but the resulting
files still contain sensitive production data:

```powershell
$BackupDir = Join-Path $env:USERPROFILE "PCOReady-Private-Backups\YYYY-MM-DD"
New-Item -ItemType Directory -Force -Path $BackupDir
$env:SUPABASE_DB_URL = Read-Host "Supabase connection string"
supabase db dump --db-url $env:SUPABASE_DB_URL -f (Join-Path $BackupDir "roles.sql") --role-only
supabase db dump --db-url $env:SUPABASE_DB_URL -f (Join-Path $BackupDir "schema.sql")
supabase db dump --db-url $env:SUPABASE_DB_URL -f (Join-Path $BackupDir "data.sql") --use-copy --data-only
Remove-Item Env:SUPABASE_DB_URL
```

Encrypt and upload the three files to storage outside the Supabase project and
outside Git. Supabase database backups do not restore deleted Storage API
objects, so back up storage objects separately if the application starts using
them. Run and record a non-production restore drill after any material schema
change.

## Restore Cloudflare and Zoho

### 1. Confirm domain control

- Keep `pcoready.co.uk` and `pcoready.com` registered at Fasthosts.
- Set the Fasthosts nameservers to the exact pair assigned by Cloudflare for
  each zone.
- Do not recreate live DNS at Fasthosts/Livedns.

### 2. Restore website DNS

Read the current origin address from Terraform:

```powershell
$OriginIp = terraform -chdir=infra/terraform output -raw elastic_ip
$OriginIp
```

In the Cloudflare `pcoready.co.uk` zone, create:

| Type | Name | Target | Initial proxy state |
| --- | --- | --- | --- |
| A | `@` | current Terraform Elastic IP | DNS only |
| A | `www` | current Terraform Elastic IP | DNS only |

Remove stale apex/`www` AAAA records unless the rebuilt VPC deliberately has
working IPv6. The current Terraform design is IPv4-only.

Keep records **DNS only** until Caddy has obtained a publicly trusted
certificate for both hostnames. Confirm ports 80 and 443 reach the EC2
security group. Then enable the Cloudflare proxy and set SSL/TLS encryption to
**Full (strict)**. Never use Flexible.

For `pcoready.com`, restore the apex and `www` redirect rule to the canonical
`https://pcoready.co.uk` site. Preserve the request path/query when supported.
The `.com` domain is not an email domain.

### 3. Restore Zoho Mail records on `pcoready.co.uk`

| Type | Name | Target/value | Priority |
| --- | --- | --- | --- |
| MX | `@` | `mx.zoho.eu` | 10 |
| MX | `@` | `mx2.zoho.eu` | 20 |
| MX | `@` | `mx3.zoho.eu` | 50 |
| TXT | `@` | `v=spf1 include:zoho.eu ~all` | N/A |
| TXT | `zmail._domainkey` | Current value generated by Zoho | N/A |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@pcoready.co.uk` | N/A |

Obtain DKIM from the Zoho Admin Console rather than copying an old/truncated
value. Do not proxy mail records. Do not enable Cloudflare Email Routing while
Zoho handles mail. Do not add Zoho records to `pcoready.com` unless email is
deliberately enabled there.

Confirm both mailboxes, 2FA, and send/receive:

- `admin@pcoready.co.uk`
- `support@pcoready.co.uk`

## End-to-end validation

### Infrastructure and host

```powershell
terraform -chdir=infra/terraform plan
terraform -chdir=infra/terraform output -raw elastic_ip
```

The plan should be empty after recovery. In AWS, confirm:

- one intended production EC2 instance and one associated Elastic IP
- inbound TCP 80/443 only; port 22 absent unless temporarily restricted
- SSM connectivity and the expected EC2 instance role
- no public app port 3000, Postgres, or Supabase Studio port
- encrypted root/data EBS volumes
- current CloudWatch metrics and alarms
- backup bucket public access block, encryption, versioning, and lifecycle
- DLM daily snapshot policy and the intended EventBridge schedule

On EC2:

```bash
sudo docker compose -f /srv/topopass/deploy/docker-compose.prod.yml ps
sudo docker inspect --format='{{.State.Health.Status}}' topopass-web
sudo docker compose -f /srv/topopass/deploy/docker-compose.prod.yml logs --tail 100 caddy
curl -I http://pcoready.co.uk
curl -I https://pcoready.co.uk
curl -I https://www.pcoready.co.uk
curl -fsS https://pcoready.co.uk/api/health
```

Expected:

- HTTP redirects to HTTPS.
- The apex loads successfully over HTTPS.
- `www` permanently redirects to the apex and preserves the path/query.
- `/api/health` returns safe healthy JSON.
- `topopass-web` is healthy and Caddy is running.
- Caddy shows no continuing certificate or upstream errors.

### Application

Test in a private browser window and on mobile:

- homepage, navigation, metadata, and footer show PCO Ready
- sign-up, login, logout, password recovery, and auth callback
- account persistence and protected admin access
- Topographical and SERU practice
- map-click and route-learning pages with Mapbox/atlas assets
- mock test, review, mistakes, and progress flows
- newsletter/beta feedback if enabled
- no mixed-content, CORS, callback, or browser-console errors
- support links use `support@pcoready.co.uk`

### DNS and email

```powershell
Resolve-DnsName pcoready.co.uk
Resolve-DnsName www.pcoready.co.uk
Resolve-DnsName pcoready.co.uk -Type MX
Resolve-DnsName pcoready.co.uk -Type TXT
```

Confirm Cloudflare is authoritative, Full (strict) is active, the `.com`
redirect works, Zoho sends/receives, and SPF/DKIM/DMARC validate.

## Backup readiness after recovery

The Terraform-managed S3/Postgres backup scripts under [`infra/backups`](../infra/backups)
are for a future self-hosted Postgres/Supabase container. They are not active
database protection for the current managed Supabase architecture.

After every recovery:

- create and securely store a fresh Terraform state backup
- export Cloudflare DNS/redirect configuration
- verify a managed Supabase logical export and keep it off-site
- record the deployed Git commit and ECR SHA tag
- confirm Secrets Manager recovery access without printing the value
- verify EC2/DLM snapshots and retention
- test an EC2 reboot and automatic Compose startup
- run a non-production Supabase restore drill
- review domain renewal, AWS Budget, Supabase plan, and alert recipients

## Related documentation

- [AWS/EC2 deployment guide](aws-ec2-devops-deployment.md)
- [Terraform reference](../infra/terraform/README.md)
- [PC Ready domain and email setup](pc-ready-domain-email-setup.md)
- [PC Ready production cutover](pc-ready-production-cutover.md)
- [AWS go-live checklist](../AWS_GO_LIVE_CHECKLIST.md)
- [Self-hosted Postgres restore reference](../infra/backups/restore-postgres.md)
