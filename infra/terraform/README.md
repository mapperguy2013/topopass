# TopoPass EC2 Terraform

This Terraform root provisions the low-cost production deployment target for
TopoPass.

It creates:

- one EC2 host
- Docker and Docker Compose plugin through `user_data`
- persistent EBS data volume
- Elastic IP
- HTTP/HTTPS security group
- SSH disabled by default
- optional SSH ingress only when `ssh_cidr_blocks` is set
- IAM role for SSM Session Manager
- IAM permission to pull from ECR
- CloudWatch agent/log support
- optional Route 53 A records for the apex app domain, `www`, and the Supabase
  gateway subdomain
- daily EBS snapshot policy
- private S3 backup bucket for logical Postgres/storage backups
- CloudWatch log groups, alarms, and SNS alert topic
- AWS Budget alerts and an optional EC2 stop kill switch for cost protection
- optional AWS Secrets Manager runtime app env secret metadata

It does not deploy the application containers and it does not write production
secrets.

## Secret Rules

- Do not put app secrets in Terraform variables.
- Do not put Supabase secrets, database passwords, JWT secrets, API keys, or
  `.env.production` values in Terraform.
- Do not commit `terraform.tfvars`.
- Do not commit Terraform state.
- Terraform state must not contain application secrets.
- Production env files should be created manually on the EC2 instance or later
  supplied through AWS Secrets Manager or SSM Parameter Store.

## Prepare Variables

Copy the example file:

```powershell
Copy-Item infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edit `infra/terraform/terraform.tfvars` locally. Keep it untracked.

Important defaults:

- AWS region: `eu-west-2`
- instance type: `t3.small`
- root volume: `30` GB
- data volume: `50` GB
- SSH ingress: disabled
- Route 53 record: disabled
- snapshot retention: `14` daily snapshots by default
- S3 logical backup retention: `14` days by default
- CloudWatch log retention: `14` days by default
- Monthly AWS Budget: `20 USD` by default
- Budget kill switch: disabled by default
- Runtime Secrets Manager secret metadata: enabled by default
- Runtime secret name: `topopass/production/app-env`

Optional domain defaults:

- `domain_name = "example.com"`
- `supabase_subdomain = "supabase"`
- `enable_route53_records = false`

When `enable_route53_records = true`, Terraform creates A records pointing to
the Elastic IP for:

- `example.com`
- `www.example.com`
- `supabase.example.com`

## Terraform Commands

From the repository root:

```powershell
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan
terraform -chdir=infra/terraform apply
```

## Monitoring And Alerts

Terraform creates:

- CloudWatch log groups for user-data, syslog, backups, Caddy, and deployment
  logs.
- CloudWatch alarms for EC2 status check failure, high CPU, high memory, and
  high disk usage.
- An SNS topic for alerts.
- Optional email subscription when `alert_email` is set.

The email subscription must be confirmed from the inbox before alerts are
delivered.

The CloudWatch agent config lives at `infra/monitoring/cloudwatch-agent.json`.
`user_data` installs the agent and writes that config to the host.

## AWS Budget Cost Protection

Terraform creates a monthly AWS Budget and a dedicated budget-alert SNS topic.
Defaults are intentionally conservative:

- `budget_limit_amount = 20`
- `budget_limit_unit = "USD"`
- `budget_alert_email = ""`
- `enable_budget_kill_switch = false`

Budget notifications:

- `50%` actual spend publishes to the budget SNS topic for email alerting.
- `80%` forecasted spend publishes to the budget SNS topic for email alerting.
- `100%` actual spend publishes to the budget SNS topic and, only when
  `enable_budget_kill_switch = true`, invokes Lambda.

The Lambda can only describe instances and stop EC2 instances tagged:

```text
Project = topopass
Environment = production
```

It does not have permissions to terminate EC2 instances, delete EBS volumes,
delete snapshots, change Route 53, delete ECR repositories, or read/delete
Secrets Manager values.

AWS Budgets notifications are not instant and are not a hard spending cap. Treat
the kill switch as a last-resort safety net. You should still monitor the AWS
Billing console, use small instance sizes, and review cost explorer regularly.

## Runtime Env With AWS Secrets Manager

Terraform can create the production runtime app env secret metadata without
putting secret values in state.

Variables:

- `enable_runtime_secrets_manager = true`
- `runtime_secret_name = "topopass/production/app-env"`

Resources:

- `aws_secretsmanager_secret.runtime_app_env`
- an inline EC2 role policy allowing only `secretsmanager:GetSecretValue` for
  that secret ARN

Terraform does not create `aws_secretsmanager_secret_version`, does not accept a
secret string variable, and does not store runtime dotenv content in state.

Outputs:

```powershell
terraform -chdir=infra/terraform output runtime_secret_name
terraform -chdir=infra/terraform output runtime_secret_arn
```

After apply:

1. Open AWS Secrets Manager in `eu-west-2`.
2. Open the secret from `runtime_secret_name`.
3. Edit the secret value manually.
4. Store plain dotenv text only.
5. Do not paste the value into Terraform variables, GitHub Actions logs,
   commits, pull requests, screenshots, or support messages.

Do not store JSON in this secret. It must be plain dotenv text. The EC2 fetch
script normalizes Windows CRLF line endings to Unix LF after writing
`/srv/topopass/env/app.env`.

Example shape:

```dotenv
NEXT_PUBLIC_SITE_URL=http://YOUR_EC2_PUBLIC_IP
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

`NEXT_PUBLIC_*` values are visible in browser bundles. Server-only values must
not use the `NEXT_PUBLIC_` prefix. Privileged backend keys, if ever needed,
must remain server-only and must not be logged, committed, or printed.

Fetch the runtime env on the EC2 host:

```bash
cd /srv/topopass
sudo bash infra/deploy/fetch-runtime-env.sh
sudo ls -l /srv/topopass/env/app.env
```

The file is written as root-owned with `0600` permissions. Run deployment with
`sudo` when this file is used:

```bash
sudo bash infra/deploy/deploy-ec2-compose.sh
```

## S3 Logical Backups

Terraform creates a private S3 backup bucket with:

- public access blocked
- AES256 server-side encryption
- versioning enabled
- lifecycle expiration for backup objects
- EC2 role permissions scoped to the configured backup bucket and prefix

Useful variables:

- `backup_bucket_name`: optional explicit bucket name
- `backup_s3_prefix`: default `topopass`
- `backup_retention_days`: default `14`
- `backup_transition_to_ia_days`: default `0`

Set these host-side values in `/opt/topopass/.env.production` after apply:

```bash
BACKUP_S3_BUCKET=$(terraform -chdir=infra/terraform output -raw backup_bucket_name)
BACKUP_S3_PREFIX=$(terraform -chdir=infra/terraform output -raw backup_s3_prefix)
POSTGRES_CONTAINER_NAME=supabase-db
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-on-host-only
```

Do not put database passwords in Terraform variables or state.

## Connect With SSM

Use the `ssm_session_command` output:

```powershell
terraform -chdir=infra/terraform output ssm_session_command
```

Then run the printed command. SSH is disabled by default and should stay
disabled unless there is a clear operational need.

## Host Directories

`user_data` prepares:

- `/srv/topopass`
- `/srv/topopass-data`
- `/srv/topopass-data/postgres`
- `/srv/topopass-data/storage`
- `/srv/topopass-data/backups`
- `/srv/topopass/logs/caddy`
- `/srv/topopass/logs/deploy`
- `/var/log/topopass/backups`

The persistent EBS data volume is mounted at `/srv/topopass-data` and added to
`/etc/fstab` so it survives reboots.

## Add Runtime Env Manually

After the instance exists, fetch `app.env` from Secrets Manager or create
runtime env files manually on the host:

```bash
sudo mkdir -p /srv/topopass/env
sudo nano /srv/topopass/env/proxy.env
```

If Secrets Manager is disabled, create `/srv/topopass/env/app.env` manually on
the host. Do not put these values in Terraform state. Do not commit them to Git.

`proxy.env` should contain placeholder-derived production values only on the
host:

```bash
APP_DOMAIN=:80
WWW_DOMAIN=http://www.topopass.invalid
SUPABASE_DOMAIN=http://supabase.topopass.invalid
ACME_EMAIL=admin@example.com
```

For real DNS later, change those values to the apex domain, `www` domain, and
Supabase gateway subdomain.

## Deploy With Docker Compose Later

After the host exists and the app image has been pushed to ECR:

1. Connect with SSM.
2. Authenticate Docker to ECR.
3. Copy or pull the repository under `/srv/topopass`.
4. Create env files manually on the host.
5. Run the deployment script:

```bash
cd /srv/topopass
sudo bash infra/deploy/fetch-runtime-env.sh
sudo bash infra/deploy/deploy-ec2-compose.sh
```

The script logs in to ECR with the EC2 instance role, pulls the latest app
image, validates the Compose config, starts the stack, shows container status,
and runs a local Caddy health check.

Manual equivalent:

```bash
cd /srv/topopass
export TOPOPASS_IMAGE=006419716542.dkr.ecr.eu-west-2.amazonaws.com/topopass-web:latest
export TOPOPASS_APP_ENV_FILE=/srv/topopass/env/app.env
export TOPOPASS_PROXY_ENV_FILE=/srv/topopass/env/proxy.env
docker compose -f deploy/docker-compose.prod.yml config
docker compose -f deploy/docker-compose.prod.yml pull
docker compose -f deploy/docker-compose.prod.yml up -d --remove-orphans
docker compose -f deploy/docker-compose.prod.yml logs --tail 100 caddy
```

Production containers are not started automatically by Terraform.

The production Compose template publishes only Caddy on ports `80` and `443`.
The Next.js app stays internal on `app:3000`, and the Supabase gateway is
expected to be internal on `kong:8000` when the self-hosted Supabase stack is
added. Do not publish Postgres, Kong, Studio, or app ports directly.

## HTTPS Checks

Before DNS is connected, smoke test HTTP through the EC2 public IP:

```bash
curl -I http://127.0.0.1
curl -fsS http://127.0.0.1/api/health
curl -I http://<EC2_PUBLIC_IP>
```

After DNS has propagated and Caddy has started:

- `http://example.com` should redirect to `https://example.com`.
- `https://example.com` should load the Next.js app.
- `https://www.example.com` should redirect to `https://example.com`.
- `https://supabase.example.com` should reach the Supabase gateway.
- Browser console should show no mixed-content errors.
- Public scans should show only ports `80` and `443` open.
- Caddy logs should show successful certificate issuance.

## Enable Backup Timer

After the repository is present on the host and the host-only env file exists:

```bash
sudo cp /srv/topopass/infra/backups/systemd/topopass-postgres-backup.service /etc/systemd/system/
sudo cp /srv/topopass/infra/backups/systemd/topopass-postgres-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now topopass-postgres-backup.timer
systemctl list-timers topopass-postgres-backup.timer
```

Run a manual dry run first:

```bash
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/backup-postgres.sh --dry-run
```

Restore instructions are in `infra/backups/restore-postgres.md`.

## Destroy Infrastructure

```powershell
terraform -chdir=infra/terraform destroy
```

Before destroying, confirm whether the persistent EBS data volume and snapshots
contain data that must be retained or exported.

## Notes

- This root currently uses local Terraform state unless you configure a remote
  backend separately.
- Do not commit local state files.
- Do not add application secrets to Terraform.
- If Route 53 is enabled, set `route53_zone_name`, `domain_name`, and
  `create_route53_record = true`.
