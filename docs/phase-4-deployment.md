# Phase 4: Low-Cost Deployment and Domain Operations

Status: PC Ready production-domain cutover prepared; owner-side apply and DNS
cutover pending.

Phase 4 prepared a low-cost AWS deployment for the Next.js application and
records the PC Ready domain and email setup. `pcoready.co.uk` is now the
canonical production hostname for this application. Cloudflare remains the DNS
authority while Terraform continues to manage only the AWS infrastructure.

## Steps

| Step | Brief description | Status |
| --- | --- | --- |
| 40 | Add the production Dockerfile, environment templates, Compose scaffold, and deployment guide. | Complete |
| 41 | Dockerise the application with a non-root runtime and health checks. | Complete |
| 42 | Publish Git-SHA and `latest` images to private ECR through GitHub Actions and OIDC. | Complete |
| 43 | Define the EC2 host, Elastic IP, EBS data, IAM, security, ECR pull, monitoring, and optional DNS infrastructure in Terraform. | Complete |
| 44 | Put Caddy in front of the app and prepare domain/HTTPS routing. | Complete |
| 45 | Add health monitoring, CloudWatch alarms/logs, budget controls, backups, and restore guidance. | Complete as configuration; live checks remain operational work |
| 47.6 | Add optional Europe/London EC2 start/stop schedules to reduce cost. | Complete |
| 48A | Harden and smoke-test the public-IP HTTP deployment with Caddy as the only public application service. | Complete |
| 48B | Record completed PC Ready Cloudflare DNS, redirects, Zoho Mail authentication, and account security. | Complete |
| 48C | Configure Terraform HTTPS ingress, Caddy, application URLs, and support contacts for the `pcoready.co.uk` production cutover. | Repository complete; owner cutover pending |

## Current boundary

The existing EC2 Elastic IP remains `13.134.170.158`. Terraform now allows
ports 80 and 443, and Caddy is configured for the apex plus a `www` redirect.
The actual Terraform apply, Cloudflare record change, certificate bootstrap,
Supabase Auth URL update, image rebuild, and EC2 deployment are owner actions.

PC Ready uses Fasthosts as registrar, Cloudflare for authoritative DNS/CDN, and
Zoho Mail for `pcoready.co.uk`. Route 53 remains disabled, and managed Supabase
remains in use without a `supabase.pcoready.co.uk` record.

## Related documents

- [PCO Ready disaster recovery runbook](disaster-recovery.md)
- [AWS EC2 deployment and operations guide](aws-ec2-devops-deployment.md)
- [AWS go-live checklist](../AWS_GO_LIVE_CHECKLIST.md)
- [Terraform guide](../infra/terraform/README.md)
- [PC Ready domain and email setup](pc-ready-domain-email-setup.md)
- [PC Ready production cutover](pc-ready-production-cutover.md)
