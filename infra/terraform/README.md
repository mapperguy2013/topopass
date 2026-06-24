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
  supplied through SSM Parameter Store.

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
- snapshot retention: `7` daily snapshots

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

The persistent EBS data volume is mounted at `/srv/topopass-data` and added to
`/etc/fstab` so it survives reboots.

## Add Runtime Env Manually

After the instance exists, create runtime env files manually on the host, for
example:

```bash
sudo mkdir -p /srv/topopass/env
sudo nano /srv/topopass/env/app.env
sudo nano /srv/topopass/env/proxy.env
```

Do not put these values in Terraform state. Do not commit them to Git.

`proxy.env` should contain placeholder-derived production values only on the
host:

```bash
APP_DOMAIN=example.com
WWW_DOMAIN=www.example.com
SUPABASE_DOMAIN=supabase.example.com
ACME_EMAIL=admin@example.com
```

## Deploy With Docker Compose Later

After the host exists and the app image has been pushed to ECR:

1. Connect with SSM.
2. Authenticate Docker to ECR.
3. Copy or pull the repository under `/srv/topopass`.
4. Create env files manually on the host.
5. Run:

```bash
cd /srv/topopass
export TOPOPASS_APP_ENV_FILE=/opt/topopass/env/app.env
export TOPOPASS_PROXY_ENV_FILE=/opt/topopass/env/proxy.env
docker compose -f deploy/docker-compose.prod.yml config
docker compose -f deploy/docker-compose.prod.yml pull
docker compose -f deploy/docker-compose.prod.yml up -d
docker compose -f deploy/docker-compose.prod.yml logs -f caddy
```

Production containers are not started automatically by Terraform.

The production Compose template publishes only Caddy on ports `80` and `443`.
The Next.js app stays internal on `app:3000`, and the Supabase gateway is
expected to be internal on `kong:8000` when the self-hosted Supabase stack is
added. Do not publish Postgres, Kong, Studio, or app ports directly.

## HTTPS Checks

After DNS has propagated and Caddy has started:

- `http://example.com` should redirect to `https://example.com`.
- `https://example.com` should load the Next.js app.
- `https://www.example.com` should redirect to `https://example.com`.
- `https://supabase.example.com` should reach the Supabase gateway.
- Browser console should show no mixed-content errors.
- Public scans should show only ports `80` and `443` open.
- Caddy logs should show successful certificate issuance.

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
