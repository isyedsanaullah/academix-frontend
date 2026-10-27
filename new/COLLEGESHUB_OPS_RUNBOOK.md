# Collegeshub Operations Runbook — Phase 8

> **Scope**: Onboarding, invite, and slug issues for the Collegeshub platform.
> **Last updated**: 2026-10-27

---

## Runbook 1 — "Invite never arrived"

### Symptoms
- College admin says they never received the setup email.
- Email status shows `failed` in the super admin panel.

### Diagnosis Steps

```sql
-- 1. Check the invite record
SELECT id, email, email_status, email_error, expires_at, used_at, revoked_at, created_at
FROM "CollegeInvite"
WHERE college_id = '<COLLEGE_ID>'
ORDER BY created_at DESC
LIMIT 5;
```

```bash
# 2. Check backend logs for mail errors
grep "MailService" /var/log/collegeshub/backend.log | tail -50
```

### Resolution

| Scenario | Action |
|----------|--------|
| `email_status = 'failed'` | Click **Retry Email** in Super Admin → Colleges → Invite Status |
| Invite expired (check `expires_at`) | Click **Resend Invite** — this revokes old link and creates a fresh 7-day invite |
| Email in spam | Ask admin to whitelist `mail.collegeshub.org` (or your sending domain) |
| Email provider outage | Wait for recovery, then retry from panel |
| Wrong email address on invite | Revoke the invite, re-approve with the correct email |

### Verification
After resending, confirm:
1. `email_status` changes to `sent` within 1 minute.
2. `expires_at` is 7 days from now.
3. Admin confirms receipt.

---

## Runbook 2 — "College stuck in onboarding"

### Symptoms
- College status remains `onboarding` after admin says they clicked Launch.
- Staff/students cannot log in (getting "College setup not finished" error).

### Diagnosis Steps

```sql
-- 1. Check college status and onboarding state
SELECT id, name, slug, status, onboarding_state, activated_at
FROM "College"
WHERE id = '<COLLEGE_ID>';

-- 2. Check required launch criteria from real data
-- Profile: name, city, phone/email, logo_key
SELECT name, city, phone, email, logo_key FROM "College" WHERE id = '<COLLEGE_ID>';

-- 3. Count sessions and classes
SELECT COUNT(*) FROM "Session" WHERE college_id = '<COLLEGE_ID>';
SELECT COUNT(*) FROM "Class" WHERE college_id = '<COLLEGE_ID>';

-- 4. Check if email is verified
SELECT email_verified, "emailVerified" FROM "User" 
WHERE college_id = '<COLLEGE_ID>' AND role = 'admin' LIMIT 1;
```

### Resolution

| Root Cause | Action |
|------------|--------|
| Email not verified | Ask admin to visit `/verify-email` and verify their email |
| Profile incomplete | Ask admin to complete: name, city, contact (phone or email), and logo |
| No session created | Ask admin to create at least 1 academic session in onboarding Step 2 |
| No class created | Ask admin to create at least 1 class in onboarding Step 2 |
| Launch endpoint error | Check logs for the `launchCollegeWorkspace` controller — fix underlying error |
| DB transaction failed | Check for Prisma errors in logs around `status` update |

**Emergency override (only for verified issues where the UI is broken):**
```sql
-- Only run this AFTER confirming all 4 required criteria are met in the DB
BEGIN;
UPDATE "College"
SET status = 'active', activated_at = NOW()
WHERE id = '<COLLEGE_ID>' AND status = 'onboarding';
-- Verify exactly 1 row was updated before committing:
COMMIT;
```

> ⚠️ Always confirm all 4 required launch items are truly complete before the emergency override.

### Verification
After resolution:
1. College status = `active`.
2. `activated_at` is set.
3. Staff can log in at `{slug}.collegeshub.org/login`.
4. Public profile is visible at `{slug}.collegeshub.org`.

---

## Runbook 3 — "Wrong slug assigned"

### Symptoms
- College's public profile is accessible at the wrong subdomain.
- College admin received an invite link with the wrong slug.

### Diagnosis Steps

```sql
-- 1. Find the college
SELECT id, name, slug, status, activated_at FROM "College"
WHERE name ILIKE '%<COLLEGE_NAME>%';

-- 2. Check if the intended slug is already taken
SELECT id, name, slug FROM "College" WHERE slug = '<INTENDED_SLUG>';

-- 3. Check if it's a reserved slug
-- Reserved: www, app, api, admin, mail, status, support, help, docs, blog, cdn,
--           static, assets, dev, test, staging, root, collegeshub, college,
--           login, register, dashboard, super-admin, superadmin, ns1, ns2,
--           ftp, smtp, imap, pop, billing, account
```

### Resolution

> ⚠️ **Slugs are immutable once the college is `active`** — changing a slug breaks all existing links, bookmarks, and invite URLs. This is a last-resort operation.

**Pre-conditions before slug change:**
- [ ] College is still in `pending_setup` or `onboarding` status (not `active`).
- [ ] OR a new invite has NOT been sent yet (so the old invite URL can be invalidated).
- [ ] The intended slug passes `isValidSlug()` validation.
- [ ] The intended slug is not taken by another college.

**For colleges in pending_setup / onboarding (safe):**
```sql
BEGIN;
-- Revoke the old invite (so the old slug-based URL is dead)
UPDATE "CollegeInvite"
SET revoked_at = NOW()
WHERE college_id = '<COLLEGE_ID>' AND used_at IS NULL AND revoked_at IS NULL;

-- Update the slug
UPDATE "College"
SET slug = '<NEW_SLUG>'
WHERE id = '<COLLEGE_ID>' AND status IN ('pending_setup', 'onboarding');

COMMIT;
```

Then resend the invite from the Super Admin panel to generate a new link with the correct slug.

**For active colleges (consult with CTO before proceeding):**
1. Update slug in DB.
2. Update DNS (Cloudflare: rename the `A`/`CNAME` record for the old slug to the new slug).
3. Set up a Cloudflare redirect rule: `<old-slug>.collegeshub.org` → `<new-slug>.collegeshub.org` (permanent 308).
4. Notify the college admin of the change.
5. Resend any open staff invite links (they contain the subdomain in the set-password URL).

### Verification
1. `{new-slug}.collegeshub.org` loads the correct college profile.
2. `{old-slug}.collegeshub.org` redirects to the new slug (if active).
3. College admin can log in at the new slug.

---

## Runbook 4 — Rate Limit Troubleshooting

### Rate Limit Configurations (Phase 8)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 15 req | 15 min |
| `POST /api/auth/verify-email` | 10 req | 15 min |
| `POST /api/auth/resend-verification` | 10 req | 15 min |
| `POST /api/public/resolve-code` | 10 req | 1 min |
| `GET/POST /api/public/invites/:token` | 20 req | 15 min |
| `GET/POST /api/public/set-password/:token` | 20 req | 15 min |

### Symptoms
- User gets `429 Too Many Requests`.
- Legitimate admin is locked out.

### Resolution
- Rate limits are in-memory (express-rate-limit). Restarting the server clears them.
- If a legitimate user is locked out, they must wait for the window to expire OR restart the server (Render: click "Manual Deploy" to restart).
- For persistent brute-force attempts: check Cloudflare WAF logs and add an IP block rule.

---

## Runbook 5 — Cron Job Failures

### Verify cron job is running (Render dashboard)
1. Go to Render Dashboard → Cron Jobs.
2. Check the last run time and exit code.
3. Click "Logs" for the failing job.

### Manual trigger (for testing or recovery)
```bash
curl -X POST https://api.collegeshub.org/api/cron/nudge-stalled-onboarding \
  -H "X-Cron-Secret: <CRON_SECRET>"

curl -X POST https://api.collegeshub.org/api/cron/invite-expiry-reminder \
  -H "X-Cron-Secret: <CRON_SECRET>"

curl -X POST https://api.collegeshub.org/api/cron/cleanup-expired-tokens \
  -H "X-Cron-Secret: <CRON_SECRET>"
```

All jobs are idempotent — safe to run manually multiple times.

---

## Email Deliverability Checklist

For `collegeshub.org` (verify at [mxtoolbox.com](https://mxtoolbox.com)):

| Record | Required Value | Purpose |
|--------|----------------|---------|
| SPF | `v=spf1 include:<mail-provider> ~all` | Authorize sending IP |
| DKIM | TXT record from mail provider | Sign outgoing email |
| DMARC | `v=DMARC1; p=quarantine; rua=mailto:dmarc@collegeshub.org` | Policy for failed auth |
| MX | Mail provider MX records | Receiving (for bounces) |

### Bounce Handling
- The `mailService.send()` wrapper returns `{ success: false, error }` without throwing.
- Callers store `email_status = 'failed'` and `email_error = error.message`.
- Super admin can retry failed emails from the panel.
- Configure bounce webhooks in your mail provider to automatically update delivery status.

---

## Security Contacts

| Issue | Contact |
|-------|---------|
| Suspected account takeover | security@collegeshub.org immediately |
| Suspicious slug registration | admin@collegeshub.org |
| Mail provider outage | Check provider status page |
| Database connectivity | Neon dashboard → Connection Pooling |
