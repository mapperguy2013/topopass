# Phase 4: Low-Cost Deployment and Domain Operations

Status: Complete for IP-based TOPOPASS smoke-test readiness; production-domain
cutover remains deferred.

Phase 4 prepared a low-cost AWS deployment for the Next.js application and
recorded a separate completed PC Ready domain and email setup. These are two
distinct operational tracks and must not be treated as one DNS environment.

## Steps

| Step | Brief description | Status |
| --- | --- | --- |
| 40 | Add the production Dockerfile, environment templates, Compose scaffold, and deployment guide. | Complete |
| 41 | Dockerise the application with a non-root runtime and health checks. | Complete |
| 42 | Publish Git-SHA and `latest` images to private ECR through GitHub Actions and OIDC. | Complete |
| 43 | Define the EC2 host, Elastic IP, EBS data, IAM, security, ECR pull, monitoring, and optional DNS infrastructure in Terraform. | Complete |
| 44 | Put Caddy in front of the app and prepare domain/HTTPS routing while retaining temporary public-IP mode. | Complete as configuration; domain cutover deferred |
| 45 | Add health monitoring, CloudWatch alarms/logs, budget controls, backups, and restore guidance. | Complete as configuration; live checks remain operational work |
| 47.6 | Add optional Europe/London EC2 start/stop schedules to reduce cost. | Complete |
| 48A | Harden and smoke-test the public-IP HTTP deployment with Caddy as the only public application service. | Complete |
| 48B | Record completed PC Ready Cloudflare DNS, redirects, Zoho Mail authentication, and account security. | Complete; separate from TOPOPASS EC2 |

## Current boundary

The TOPOPASS deployment remains an HTTP/IP smoke-test environment. A real
TOPOPASS production domain, DNS cutover, port 443, certificates, production
launch monitoring, and any self-hosted Supabase decision remain separate work.

PC Ready uses Fasthosts as registrar, Cloudflare for authoritative DNS/CDN, and
Zoho Mail for `pcoready.co.uk`. It does not use the TOPOPASS Route 53 plan.

## Related documents

- [AWS EC2 deployment and operations guide](aws-ec2-devops-deployment.md)
- [AWS go-live checklist](../AWS_GO_LIVE_CHECKLIST.md)
- [Terraform guide](../infra/terraform/README.md)
- [PC Ready domain and email setup](pc-ready-domain-email-setup.md)
