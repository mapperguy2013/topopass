# AWS Go-Live Checklist

This checklist reviews Steps 41-45 against a brand-new AWS account before any
`terraform apply` or GitHub Actions deployment is run.

Do not put real secrets, `.env` files, Terraform state, AWS credentials,
Docker build output, `.next`, `node_modules`, logs, or local `terraform.tfvars`
files in Git.

## Current Deployment Shape

- Next.js is built with the production `Dockerfile`.
- GitHub Actions publishes the app Docker image to private ECR.
- Terraform provisions one EC2 Docker host, Elastic IP, optional Route 53
  records, CloudWatch monitoring, S3 backups, EBS snapshots, and an optional
  AWS Budget kill switch.
- `deploy/docker-compose.prod.yml` runs Caddy plus the app container.
- Self-hosted Supabase containers are planned but not deployed by Terraform yet.
- Runtime secrets are expected to live on the EC2 host or a future secret sync
  path, not in Terraform state.

## Before Terraform Apply

- [ ] Secure the AWS root user with MFA.
- [ ] Enable billing access for IAM users if needed.
- [ ] Create an initial billing alert or AWS Budget in the account console.
- [ ] Create or confirm an IAM admin user/role for infrastructure work.
- [ ] Choose `eu-west-2` as the production region unless there is a clear
      reason to change it.
- [ ] Install and configure AWS CLI locally.
- [ ] Verify CLI identity with `aws sts get-caller-identity`.
- [ ] Decide Terraform state storage before first apply:
      - local state for a private single-operator beta, or
      - an S3 backend plus DynamoDB locking for safer shared operations.
- [ ] If using remote state, create the backend bucket/table manually before
      enabling a backend config.
- [ ] Confirm no application secrets are passed through Terraform variables.
- [ ] Copy `infra/terraform/terraform.tfvars.example` to the untracked
      `infra/terraform/terraform.tfvars`.
- [ ] Set only non-secret infrastructure values in `terraform.tfvars`.
- [ ] Keep `enable_budget_kill_switch = false` until budget alerts are tested.
- [ ] Run `terraform -chdir=infra/terraform fmt -recursive`.
- [ ] Run `terraform -chdir=infra/terraform validate`.
- [ ] Run `terraform -chdir=infra/terraform plan`.
- [ ] Review the plan for public ports, tags, IAM scope, Route 53 records, and
      cost-related resources.

## Brand-New AWS Account Setup

- [ ] Root account MFA is enabled.
- [ ] Alternate contacts are configured.
- [ ] Billing alerts are enabled.
- [ ] AWS Budgets access is available in the account.
- [ ] IAM admin access is configured for day-to-day work.
- [ ] No long-lived AWS access keys are committed or stored in the repository.
- [ ] AWS CLI profile is configured locally outside the repository.
- [ ] Default production region is `eu-west-2`.
- [ ] GitHub OIDC IAM role is created for image publishing.
- [ ] Private ECR repository exists for the app image.
- [ ] Route 53 hosted zone exists if Terraform will manage DNS records.
- [ ] Domain registrar nameservers point at the Route 53 hosted zone.
- [ ] SSM Session Manager access works for the operator identity.
- [ ] EC2 key pair is created only if SSH is required.
- [ ] SSH CIDR blocks stay empty unless a temporary owner-IP exception is
      required.
- [ ] Backup bucket naming and retention are reviewed.
- [ ] Restore test plan is scheduled before launch.

## Docker Production Readiness

- [x] `Dockerfile` uses a multi-stage Node 22 Alpine build.
- [x] The runtime stage runs as the non-root `nextjs` user.
- [x] The runtime stage exposes port `3000`.
- [x] Next.js standalone output is used.
- [x] `.dockerignore` excludes `.env*`, `.next`, `node_modules`, Git metadata,
      local logs, coverage, and generated folders.
- [x] The image does not copy committed runtime env files.
- [x] Public Supabase build args are supported without service-role keys.
- [x] `docker-compose.yml` supports local app-only Docker runs.
- [x] `deploy/docker-compose.prod.yml` keeps the app internal behind Caddy.

Before launch:

- [ ] Build the image locally or in CI without real secrets.
- [ ] Run the container with an untracked env file.
- [ ] Confirm `/api/health` returns a minimal safe response.
- [ ] Confirm production logs do not print cookies, passwords, tokens, service
      keys, raw learner answers, or raw import payloads.

## GitHub Actions And ECR

Workflow: `.github/workflows/docker-publish-ecr.yml`

Required GitHub repository variables:

- `AWS_REGION`: for example `eu-west-2`.
- `AWS_ROLE_TO_ASSUME`: IAM role ARN trusted by GitHub OIDC.
- `ECR_REPOSITORY`: private ECR repository name.

Optional GitHub repository variables:

- `NEXT_PUBLIC_SITE_URL`: production app URL.
- `NEXT_PUBLIC_SUPABASE_URL`: production Supabase public gateway URL.

Optional GitHub repository secret:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key only, never a service-role
  key.

Before enabling the workflow:

- [ ] Create the private ECR repository.
- [ ] Create a GitHub OIDC identity provider in AWS if it does not exist.
- [ ] Create the GitHub Actions role with only the ECR permissions required to
      authenticate, build metadata, and push image tags.
- [ ] Restrict the OIDC trust policy to this repository and the intended branch
      or workflow.
- [ ] Add the required GitHub variables.
- [ ] Add the optional anon key secret only if the build needs it.
- [ ] Confirm the workflow only builds and pushes; it does not deploy to EC2.

## Terraform Variables To Review

Most variables have safe defaults. These values still need explicit operator
review before first apply:

- `project_name`
- `environment`
- `aws_region`
- `instance_type`
- `root_volume_size_gb`
- `data_volume_size_gb`
- `allowed_http_cidr_blocks`
- `allowed_http_ipv6_cidr_blocks`
- `ssh_cidr_blocks`
- `key_name`
- `vpc_id`
- `public_subnet_id`
- `ecr_registry`
- `enable_route53_records`
- `route53_zone_name`
- `route53_zone_id`
- `domain_name`
- `supabase_subdomain`
- `backup_bucket_name`
- `backup_s3_prefix`
- `backup_retention_days`
- `backup_transition_to_ia_days`
- `cloudwatch_log_retention_days`
- `alert_email`
- `budget_limit_amount`
- `budget_limit_unit`
- `budget_alert_email`
- `enable_budget_kill_switch`
- `common_tags`

No current Terraform variable should contain Supabase secrets, database
passwords, JWT secrets, API keys, admin passwords, or application env file
contents.

## AWS Secrets Manager Plan

Steps 41-45 do not currently wire the app to AWS Secrets Manager. Runtime env
files are still expected to be created manually on EC2. If Secrets Manager is
used before launch, use clear names and keep secret values out of Terraform
state.

Recommended names:

| Secret name | Purpose |
| --- | --- |
| `topopass/production/app-env` | Next.js runtime env values for the app container |
| `topopass/production/proxy-env` | Caddy domain and ACME contact values |
| `topopass/production/supabase-env` | Self-hosted Supabase runtime values when added |
| `topopass/production/postgres-password` | Postgres password for self-hosted Supabase |
| `topopass/production/jwt-secret` | Self-hosted Supabase JWT secret |
| `topopass/production/backup-env` | Backup script env values if separated from app env |

Manual work still required:

- [ ] Decide whether launch uses EC2 host env files or Secrets Manager sync.
- [ ] If using Secrets Manager, create secrets manually or with a process that
      does not store secret values in Terraform state.
- [ ] Add a deployment step that writes host env files from Secrets Manager
      without printing values.
- [ ] Do not expose any service-role key in browser-visible variables.

## EC2 Security Group Requirements

Terraform should keep the production host narrow:

- Public inbound HTTP: port `80`.
- Public inbound HTTPS: port `443`.
- Public inbound SSH: disabled by default.
- Optional SSH: only when `ssh_cidr_blocks` is explicitly set to trusted owner
  IP ranges.
- Postgres: not public.
- Supabase Studio: not public.
- Supabase Kong/API: not directly public through host ports. Caddy should proxy
  the HTTPS Supabase hostname to the internal Docker network.
- App port `3000`: not public in the production Compose file.

Before launch:

- [ ] Confirm only `80` and `443` are public in the EC2 security group.
- [ ] Confirm `ssh_cidr_blocks = []` unless temporary SSH access is required.
- [ ] Confirm SSM Session Manager works for admin access.
- [ ] Confirm Docker services do not publish database or Studio ports.

## Route 53 And Domain

- [ ] Buy or transfer the production domain.
- [ ] Create the Route 53 hosted zone.
- [ ] Update registrar nameservers to Route 53.
- [ ] Wait for nameserver propagation.
- [ ] Set `domain_name`.
- [ ] Set `route53_zone_name` or `route53_zone_id`.
- [ ] Keep `enable_route53_records = false` until the hosted zone is ready.
- [ ] Enable Route 53 records only when DNS ownership is confirmed.
- [ ] Confirm Caddy can issue certificates for the apex, `www`, and Supabase
      gateway hostnames.

## CloudWatch Monitoring

Terraform and host config cover:

- CloudWatch log groups with explicit retention.
- CloudWatch agent config at `infra/monitoring/cloudwatch-agent.json`.
- EC2 status check alarm.
- CPU alarm.
- Memory alarm.
- Disk alarm.
- SNS topic and optional email subscription through `alert_email`.

Before launch:

- [ ] Confirm `alert_email` if operational alerts should go to email.
- [ ] Confirm email subscription in the AWS email inbox.
- [ ] Confirm logs arrive for user-data, syslog, Caddy, deploy logs, and backup
      logs after the host is running.
- [ ] Confirm memory and disk metrics arrive from the CloudWatch agent.
- [ ] Tune alarm thresholds after the first beta traffic.

## Backups And Restore

Terraform and scripts cover:

- S3 backup bucket with public access blocked, encryption, versioning, and
  lifecycle retention.
- EC2 IAM access scoped to the configured backup bucket and prefix.
- DLM daily EBS snapshots for the data volume.
- Logical Postgres backup script.
- Optional Supabase Storage backup script.
- Latest-backup verification script.
- Restore runbook at `infra/backups/restore-postgres.md`.

Before launch:

- [ ] Confirm `BACKUP_S3_BUCKET` and `BACKUP_S3_PREFIX` on the host.
- [ ] Run `backup-postgres.sh --dry-run`.
- [ ] Run one real Postgres backup.
- [ ] Verify the latest backup with `verify-latest-backup.sh`.
- [ ] Enable the systemd backup timer only after a manual backup succeeds.
- [ ] Run a restore test into a non-production database before launch.
- [ ] Document restore owner, expected restore time, and escalation steps.

## Self-Hosted Supabase Risks

Self-hosted Supabase is not added by Steps 41-45 yet. Before switching from
managed Supabase or adding local Supabase containers:

- [ ] Confirm exact Supabase Compose version and upgrade plan.
- [ ] Keep Postgres data on the persistent EBS data volume.
- [ ] Keep Storage data on the persistent EBS data volume.
- [ ] Keep Studio private, localhost-only, or separately protected.
- [ ] Keep Postgres private to the Docker network.
- [ ] Set all Supabase JWT, database, SMTP, dashboard, and API secrets on the
      host only.
- [ ] Apply existing migrations and verify RLS policies.
- [ ] Test auth redirects through the HTTPS Supabase gateway hostname.
- [ ] Test backup and restore before accepting real learner data.

## Terraform State And Backend Safety

- [ ] Do not commit `.terraform/`, `terraform.tfstate`, `.tfstate.backup`, or
      `terraform.tfvars`.
- [ ] Do not put application secrets in Terraform variables.
- [ ] Do not put secret values in Terraform outputs.
- [ ] Prefer S3 remote state with bucket encryption, versioning, public access
      block, and DynamoDB state locking before a team workflow.
- [ ] If local state is used for beta, store it outside Git and back it up
      securely.
- [ ] Review `git status --ignored --short` before every commit.

## Before GitHub Actions Deployment

- [ ] `npm.cmd run lint` passes.
- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `git diff --check` passes.
- [ ] Docker build passes without secrets.
- [ ] ECR workflow has required variables.
- [ ] ECR workflow uses OIDC role assumption, not committed AWS keys.
- [ ] ECR repository exists.
- [ ] EC2 instance can authenticate to ECR through its instance profile.
- [ ] Production env files exist on EC2 and are not committed.
- [ ] Caddy env file exists on EC2 and is not committed.
- [ ] DNS records point to the Elastic IP.
- [ ] Only Caddy publishes public ports.
- [ ] Backup and restore path is tested.

## Explicitly Not Ready Until Manual Setup Is Complete

- Do not run `terraform apply` until account security, region, state, domain,
  budget, and alerting decisions are complete.
- Do not run the GitHub Actions ECR workflow until the OIDC role and ECR
  repository exist.
- Do not enable the budget kill switch until the SNS email and Lambda path have
  been tested.
- Do not store production learner data in self-hosted Supabase until logical
  backup and restore have been tested.
