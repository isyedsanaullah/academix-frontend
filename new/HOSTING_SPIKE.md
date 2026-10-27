# Collegeshub — Phase 2 Hosting Spike: Subdomain & SSL Architecture

## Objective
Verify and define how `{slug}.collegeshub.org` and `admin.collegeshub.org` are served securely from **ONE Next.js frontend deployment** and **ONE Node.js/Express API deployment**.

---

## 1. Cloudflare DNS & Edge SSL (Primary Architecture)

Because Hostinger Shared/Cloud web hosting plans only issue individual SSL certificates per subdomain and do not provide automated wildcard SSL without manual provisioning, the production architecture uses **Cloudflare DNS in front of the Hostinger origin**.

### Cloudflare DNS Configuration
In Cloudflare DNS management for `collegeshub.org`:

| Type  | Name    | Content / Target             | Proxy Status | TTL  | Purpose |
|-------|---------|------------------------------|--------------|------|---------|
| `A`   | `@`     | `<HOSTINGER_ORIGIN_IP>`      | Proxied (🟠) | Auto | Root marketing domain (`collegeshub.org`) |
| `CNAME` | `www`   | `collegeshub.org`            | Proxied (🟠) | Auto | WWW alias |
| `CNAME` | `admin` | `collegeshub.org`            | Proxied (🟠) | Auto | Super Admin portal (`admin.collegeshub.org`) |
| `CNAME` | `*`     | `collegeshub.org`            | Proxied (🟠) | Auto | Wildcard for all college subdomains (`*.collegeshub.org`) |
| `CNAME` | `api`   | `<RENDER_SERVICE_URL>`       | Proxied (🟠) | Auto | Express API backend (`api.collegeshub.org`) |

### Cloudflare SSL/TLS Settings
- **Encryption Mode**: `Full (Strict)` with a free Cloudflare Origin Certificate (15-year validity) installed in Hostinger hPanel, OR `Full` with Hostinger's default certificate.
- **Edge Certificates**: Universal SSL automatically issues a certificate covering:
  - `collegeshub.org`
  - `*.collegeshub.org`
- **Always Use HTTPS**: Enabled
- **Automatic HTTPS Rewrites**: Enabled

### Hostinger Origin Acceptance
- In Hostinger hPanel, add `collegeshub.org` as the main domain.
- Create a wildcard subdomain in hPanel: `*.collegeshub.org` pointing to the same document root / Next.js server.
- The Node.js Next.js server receives incoming HTTP requests with the original `Host` header (e.g. `Host: fmc.collegeshub.org` or `Host: admin.collegeshub.org`).

---

## 2. Fallback Architecture: Standalone VPS (Caddy / Nginx)

If the Hostinger plan prevents wildcard host routing:
- **Server**: Ubuntu VPS with Caddy v2.
- **Caddyfile**:
  ```caddy
  *.collegeshub.org, collegeshub.org {
      tls {
          dns cloudflare {env.CLOUDFLARE_API_TOKEN}
      }
      reverse_proxy localhost:3000
  }
  ```
- Caddy automatically provisions and renews Let's Encrypt wildcard certificates via DNS-01 ACME challenge using the Cloudflare API token.
- Application code remains 100% identical under both hosting models.

---

## 3. Required Environment Variables

### Frontend (`client-next/.env.production`):
```env
NEXT_PUBLIC_ROOT_DOMAIN=collegeshub.org
NEXT_PUBLIC_API_URL=https://api.collegeshub.org/api
```

### Backend (`backend/.env`):
```env
ROOT_DOMAIN=collegeshub.org
APP_URL=https://collegeshub.org
SUPER_ADMIN_ROUTING_CODE=superadmin-secure-routing-2026
```

---

## 4. Local Development Simulation
For local testing of subdomains without modifying external DNS:
- Root: `http://localhost:3000`
- Super Admin: `http://admin.localhost:3000`
- Tenant 1: `http://fmc.localhost:3000`
- Tenant 2: `http://pcs.localhost:3000`

All modern Chromium and Firefox browsers natively resolve `*.localhost` to `127.0.0.1` without needing `hosts` file modification.
