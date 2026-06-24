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
- optional Route 53 A record
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
```

Do not put these values in Terraform state. Do not commit them to Git.

## Deploy With Docker Compose Later

After the host exists and the app image has been pushed to ECR:

1. Connect with SSM.
2. Authenticate Docker to ECR.
3. Copy or create a production `docker-compose.yml` under `/srv/topopass`.
4. Create env files manually on the host.
5. Run:

```bash
cd /srv/topopass
docker compose pull
docker compose up -d
docker compose logs -f
```

Production containers are not started automatically by Terraform.

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
