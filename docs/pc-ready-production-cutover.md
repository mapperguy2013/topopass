# Step 48C: PC Ready Production Cutover

Status: Repository configuration complete; owner actions pending

Canonical site: `https://pcoready.co.uk`

Redirect alias: `https://www.pcoready.co.uk`

EC2 Elastic IP: `13.134.170.158`

DNS authority: Cloudflare

This runbook moves the application from temporary public-IP mode to the PC
Ready domain. Terraform continues to manage AWS only. It must not create a
Route 53 hosted zone or records for this domain.

## Repository changes already prepared

- Terraform's domain output is `pcoready.co.uk`, Route 53 stays disabled, and
  the EC2 security group allows TCP ports 80 and 443.
- Production Docker Compose publishes Caddy on ports 80 and 443; the Next.js
  app remains internal on port 3000.
- Caddy serves `pcoready.co.uk`, obtains its origin certificate automatically,
  and permanently redirects `www.pcoready.co.uk` to the apex.
- Build and runtime examples use `NEXT_PUBLIC_SITE_URL=https://pcoready.co.uk`.
- The application support contact is `support@pcoready.co.uk`.
- Managed Supabase remains active. No `supabase.pcoready.co.uk` record or Caddy
  route is configured.

## Owner actions in order

### 1. Apply the Terraform change

Review the plan and confirm it only adds HTTPS ingress and updates non-resource
domain outputs:

```powershell
terraform -chdir=infra/terraform fmt -recursive
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan
terraform -chdir=infra/terraform apply
```

Do not enable `enable_route53_records`; Cloudflare owns DNS.

### 2. Update Supabase Auth URLs

In the managed Supabase project, open Authentication > URL Configuration and
set:

```text
Site URL: https://pcoready.co.uk
Redirect URL: https://pcoready.co.uk/auth/callback
```

Keep the localhost redirect separately if local authentication testing is
still needed. Use the exact production callback rather than a broad wildcard.

### 3. Update the GitHub build variable

Set the GitHub Actions repository variable:

```text
NEXT_PUBLIC_SITE_URL=https://pcoready.co.uk
```

The workflow has the same fallback, but setting the variable explicitly makes
the production build intent auditable. Push or manually run the ECR workflow
after the repository changes are merged so the browser bundle is rebuilt with
the new canonical URL and support address.

### 4. Prepare the EC2 host configuration

Update `/srv/topopass/env/proxy.env`:

```env
APP_DOMAIN=pcoready.co.uk
WWW_DOMAIN=www.pcoready.co.uk
ACME_EMAIL=admin@pcoready.co.uk
```

Update `/srv/topopass/env/app.env` or its Secrets Manager source:

```env
NEXT_PUBLIC_SITE_URL=https://pcoready.co.uk
```

Keep the existing managed Supabase URL, anon key, and Mapbox token. Do not add
a `SUPABASE_DOMAIN` value.

Pull the repository/configuration and new ECR image, then deploy:

```bash
cd /srv/topopass
sudo bash infra/deploy/fetch-runtime-env.sh
sudo bash infra/deploy/deploy-ec2-compose.sh
```

Caddy may log certificate retries until DNS points at the EC2 host.

### 5. Cut over Cloudflare DNS

In the `pcoready.co.uk` Cloudflare zone:

1. Change the apex (`@`) A record from `213.171.195.105` to `13.134.170.158`.
2. Change the `www` A record from `213.171.195.105` to `13.134.170.158`.
3. Temporarily set both records to **DNS only** while Caddy obtains its first
   publicly trusted certificate.
4. Remove any stale AAAA record for the apex or `www` unless it deliberately
   points to this deployment; the current EC2 setup is IPv4-only.
5. Do not change MX, SPF, DKIM, DMARC, or other Zoho records.
6. Do not change the existing `.com` redirect rule or add Zoho records to the
   `.com` zone.

### 6. Verify the origin certificate and site

Watch Caddy and confirm both hostnames work:

```bash
docker compose -f deploy/docker-compose.prod.yml logs --tail 100 caddy
curl -I https://pcoready.co.uk
curl -I https://www.pcoready.co.uk
curl -fsS https://pcoready.co.uk/api/health
```

Expected results:

- The apex loads over HTTPS.
- HTTP redirects to HTTPS.
- `www` permanently redirects to `https://pcoready.co.uk` and preserves the
  path/query.
- `/api/health` returns the safe application health JSON.
- Caddy logs show successful certificate issuance rather than repeated ACME
  errors.

### 7. Re-enable the Cloudflare proxy

After direct HTTPS succeeds:

1. Turn the apex and `www` records back to **Proxied**.
2. Change Cloudflare SSL/TLS encryption mode from `Full` to `Full (strict)`.
3. Purge Cloudflare cache if the previous website is still shown.
4. Repeat the apex, `www`, health, login, registration, newsletter, map, and
   mobile smoke tests through Cloudflare.

Do not use Flexible mode. Full (strict) should be enabled only after Caddy is
presenting a valid certificate for the requested hostname.

## Rollback

If the new application fails before accepting production activity:

1. Change the `.co.uk` apex and `www` A records back to `213.171.195.105`.
2. Restore the previous Cloudflare proxy state.
3. Leave the Zoho email records untouched.
4. Inspect the EC2 app and Caddy logs before attempting the cutover again.

DNS rollback does not undo Terraform's port 443 ingress or remove the EC2
deployment; those can remain ready for the next attempt.
