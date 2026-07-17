# Step 48B: PC Ready Domain, DNS, Website Routing, and Email

Step 48B records the owner-completed PC Ready domain and email setup reported
on 17 July 2026. It is a separate operational track from the TOPOPASS EC2,
Route 53, and Caddy domain cutover documented in Phase 4.

## Completion status

| Area | Completed configuration |
| --- | --- |
| Domains | `pcoready.co.uk` and `pcoready.com` purchased |
| Registrar | Fasthosts retained only as the domain registrar |
| Authoritative DNS/CDN | Both domains active on the Cloudflare Free plan |
| Nameservers | Changed from Fasthosts/Livedns to Cloudflare |
| SSL/TLS | Enabled in Cloudflare and set to `Full` |
| Primary website domain | `pcoready.co.uk` |
| Email provider/domain | Zoho Mail Free plan on `pcoready.co.uk` only |
| Verification | Website routing and email send/receive tested successfully |

## Website DNS and routing

The following web records are active and proxied through Cloudflare:

| Zone | Name | Type | Target | Proxy/routing behaviour |
| --- | --- | --- | --- | --- |
| `pcoready.co.uk` | `@` | A | `213.171.195.105` | Proxied; primary website |
| `pcoready.co.uk` | `www` | A | `213.171.195.105` | Proxied; same website |
| `pcoready.com` | `@` | A | `213.171.195.105` | Proxied; redirects to `pcoready.co.uk` |
| `pcoready.com` | `www` | A | `213.171.195.105` | Proxied; redirects to `pcoready.co.uk` |

The `.co.uk` domain is canonical. Cloudflare redirect rules send both the apex
and `www` forms of the `.com` domain to `pcoready.co.uk`. The primary website
and redirects were confirmed working after nameserver propagation.

## Zoho Mail DNS

Zoho Mail handles email for `pcoready.co.uk`. The following records were added
to the `pcoready.co.uk` Cloudflare zone:

| Name | Type | Value/target | Priority |
| --- | --- | --- | --- |
| `@` | MX | `mx.zoho.eu` | 10 |
| `@` | MX | `mx2.zoho.eu` | 20 |
| `@` | MX | `mx3.zoho.eu` | 50 |
| `@` | TXT | `v=spf1 include:zoho.eu ~all` | N/A |
| `zmail._domainkey` | TXT | Zoho-generated DKIM public-key value | N/A |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:admin@pcoready.co.uk` | N/A |

Zoho validation for MX, SPF, DKIM, and DMARC was completed. Sending and
receiving were tested successfully for these users:

- `admin@pcoready.co.uk`
- `support@pcoready.co.uk`

Zoho account 2FA is enabled. The generated DKIM public key is intentionally not
duplicated in this repository; Cloudflare remains the source of truth for its
current value.

## Boundaries and guardrails

- Do not add Zoho email records to `pcoready.com` unless that domain is
  deliberately approved for email.
- Do not enable Cloudflare Email Routing on `pcoready.co.uk` while Zoho Mail is
  the active mail provider.
- Keep DMARC at `p=none` during the initial monitoring period.
- BIMI is intentionally deferred because it is optional and requires an
  enforcement-level DMARC policy plus separate logo/VMC preparation.
- Keep Fasthosts limited to registrar duties while Cloudflare remains the
  authoritative DNS provider.
- Treat Cloudflare as the source of truth for active DNS records and redirect
  rules; do not recreate conflicting live DNS records at Fasthosts/Livedns.
- This step does not replace the separate TOPOPASS AWS/Route 53/Caddy domain
  work or change the current TOPOPASS infrastructure state.

## Follow-up maintenance

- Monitor both registrar renewal dates and renewal prices, especially after
  the initial low purchase price expires.
- Review DMARC aggregate reports sent to `admin@pcoready.co.uk` and confirm all
  legitimate senders align with SPF or DKIM.
- After a stable monitoring period, move DMARC gradually from `p=none` to
  `p=quarantine`, then to `p=reject`, using a controlled rollout if needed.
- Re-test the apex, `www`, and `.com` redirects after material Cloudflare or
  origin-server changes.
- When the origin presents a publicly trusted certificate for
  `pcoready.co.uk`, move Cloudflare from `Full` to `Full (strict)` and verify
  the site before leaving the stricter mode enabled.
- Periodically confirm Zoho 2FA, recovery access, MX, SPF, DKIM, and DMARC
  remain valid.
