# Collegeshub — Phase Prompt Pack (Phases 0–9)

## How to use
1. For each phase, send the AI: **SHARED CONTEXT** (below) + **that phase's prompt** + the existing files it asks for.
2. Build in this order. Phases 1 and 2 can run in parallel. 3 needs 0+1+2. 4 needs 3. 5 needs 4. 6 needs 5. 7 needs 6. 8 can start after 4 and finish last. 9 needs 3 and 7.
3. Test each phase's acceptance list before starting the next.
4. Existing colleges must keep working at every step (they are migrated to `active`, never pushed through onboarding).
5. **Interactive Confirmation & Decision Protocol**: Before starting ANY phase, or whenever clarification/design choices are needed, the AI MUST ask the user first. Always provide structured choices:
   - **(Recommended) Option 1**: Recommended path/architecture
   - **Option 2**: Alternative approach
   - **Option 3** (if available): Edge-case, minimal, or fallback option
   Wait for user selection before making code changes or proceeding with implementation.

## Implementation Status

| Phase | Status | Key Files |
|-------|--------|-----------|
| Phase 1 — Subscription Request Lifecycle | ✅ Done | `services/subscriptionRequestTransition.js`, `controllers/subscriptionRequest.controller.js`, `SubscriptionRequests.jsx` |
| Phase 2 — Subdomain Infrastructure | ✅ Done | `middleware.js`, `lib/host.js`, `controllers/public.controller.js`, `server.js` CORS |
| Phase 3 — Approval, Provisioning & Invite Email | ✅ Done | `services/collegeProvisioning.js`, `controllers/subscriptionRequest.controller.js` (approve), schema: `CollegeInvite`, `SubscriptionPeriod` |
| Phase 4 — Accept Invite & Verify Email | ✅ Done | `publicInvite.controller.js`, `auth.controller.js`, `app/setup/[token]/page.js`, `app/verify-email/page.js` |
| Phase 5 — Onboarding Shell, College Profile & Academic Setup | ✅ Done | `onboarding.controller.js`, `onboarding.routes.js`, `CollegePublicProfileView.jsx`, `app/onboarding/page.js`, `AuthGuard.jsx` |
| Phase 6 — Staff & Student Import | ✅ Done | `staffInvite.controller.js`, `studentImport.controller.js`, `set-password/[token]`, `app/onboarding/page.js`, schema: `ImportBatch`, `ImportBatchRow` |
| Phase 7 — Review, Launch & Gating | ✅ Done | `onboarding.controller.js` (review/launch), `OnboardingChecklistWidget.jsx`, `onboarding.routes.js` |
| Phase 8 — Hardening & Ops | ✅ Done | `securityHeaders.js`, `errorHandler.js`, `cronJobs.controller.js`, `cron.routes.js`, `phase8_cross_tenant.test.js`, `ErrorPage.jsx`, `COLLEGESHUB_OPS_RUNBOOK.md` |
| Phase 9 — Subscription Management | ⬜ Next | |

### Phase 4 Implementation Notes (2026-10-27)

**Decisions made:**
- Token lookup: SHA-256 hash of raw token → `CollegeInvite.token_hash` (no new table)
- Email verification: reuses `User.verificationCode` + `User.verificationCodeExpires` (no new table)
- Dev URLs: `fmc.localhost:3000/setup/<token>` matching Phase 2 middleware
- Password minimum: 8 characters (user choice)

**Files created/changed:**
- `backend/controllers/publicInvite.controller.js` — GET + POST /public/invites/:token
- `backend/controllers/auth.controller.js` — added `verifyEmail` + `resendVerification` exports
- `backend/routes/auth.routes.js` — `/verify-email` + `/resend-verification`
- `backend/routes/public.routes.js` — `/invites/:token` GET+POST with rate limiter
- `backend/middleware/requireVerifiedEmail.js` — 403 guard for sensitive endpoints
- `client-next/app/setup/[token]/page.js` + `_client.js` — account creation form
- `client-next/app/verify-email/page.js` + `_client.js` — 6-box code input
- `backend/tests/phase4_invite.test.js` — all tests ✅

**Acceptance status:**
- ✅ Atomic invite consumption (double-submit safe via conditional `updateMany`)
- ✅ All invalid states (expired/used/revoked/invalid) return clear reason codes
- ✅ 60s resend cooldown + 5/hour limit enforced
- ✅ Constant-time code comparison (`crypto.timingSafeEqual`)
- ✅ College status advanced to `onboarding` on accept
### Phase 5 Implementation Notes (2026-10-27)

**Decisions made:**
- Full interactive guided wizard with quick-start presets (Intermediate, Matric, BS Degree, Custom) that allow inline editing, real-time public profile preview, and server-side state evaluation.
- R2 keys stored in college record (`logo_key`, `cover_key`, `gallery`) and served via signed URLs / public CDN endpoints.
- Server evaluates `onboarding_state` done/todo criteria directly from live database state (profile is done if name, city, phone/email, and logo exist; academic is done if sessionCount >= 1 and classCount >= 1).
- Extracted shared `CollegePublicProfileView.jsx` component reused across both tenant home page and the Phase 5 onboarding live preview for 100% visual fidelity.
- Login gating in `auth.controller.js` and `AuthGuard.jsx` blocks non-admins when college is in `onboarding` or `pending_setup` status with 403 `College setup is not finished yet.`.

**Files created/changed:**
- `backend/controllers/onboarding.controller.js` — `getOnboardingState`, `updateOnboardingStep`, `uploadOnboardingMedia`
- `backend/routes/onboarding.routes.js` — GET `/`, PATCH `/steps/:step`, POST `/upload`
- `backend/server.js` — mounted `/api/admin/onboarding` and `/api/onboarding`
- `backend/controllers/auth.controller.js` — onboarding status login gating and college select expansion
- `client-next/components/common/AuthGuard.jsx` — client route guard forcing onboarding for onboarding-status colleges
- `client-next/components/college/CollegePublicProfileView.jsx` — shared public profile view with live preview support
- `client-next/app/college/[college-shortcut]/_client.js` — refactored to use shared view
- `client-next/app/onboarding/page.js` — onboarding shell, stepper, profile form, academic presets & inline editor, real-time preview
- `backend/tests/phase5_onboarding.test.js` — all tests ✅

**Acceptance status:**
- ✅ Closing the browser and returning resumes on the right step; progress % matches real database data.
- ✅ Image upload size limits and MIME validation enforced (logo <= 1MB, cover <= 3MB, gallery <= 2MB).
- ✅ Live preview matches the real tenant public profile 1:1; responsive and mobile-friendly at 360px.
- ✅ Academic presets (Intermediate, Matric, BS, Custom) create sessions, classes, sections, and subjects safely in database.
- ✅ Login gating blocks non-admins when college is in `onboarding` or `pending_setup` status.

### Phase 6 Implementation Notes (2026-10-27)

**Decisions made:**
- Staff Accounts Flow: Full tokenized invitation flow where staff receive a 32-byte single-use hex token (SHA-256 hash stored in `resetCode` with 3-day expiry in `resetCodeExpires`), triggering a branded Collegeshub invitation email to `/set-password/[token]`. Replay attacks and invalid/expired tokens rejected.
- Import Batch Tracking: Dedicated Prisma models `ImportBatch` and `ImportBatchRow` to store batch metadata, row status (`created`, `skipped`, `failed`), md5 row hash for idempotency, and downloadable CSV error reports.
- Student Deduplication: Scoped per `(college_id, session_id, rollNumber)`. Duplicate records in the same academic session are cleanly skipped and logged without aborting the batch.
- Route Protection: `requireVerifiedEmail` middleware guard applied to staff and student creation endpoints.
- Dynamic Template Generation: Dynamic CSV template mapped to the college's active classes, groups, and sections configured in Academic Setup.

**Files created/changed:**
- `backend/prisma/schema.prisma` — added `ImportBatch` and `ImportBatchRow` models, migrated with `db push`
- `backend/controllers/staffInvite.controller.js` — staff list, single/bulk creation, token generation, resend invitation, public token validation and password setup
- `backend/controllers/studentImport.controller.js` — dynamic CSV template generator, sequential bulk student importer with batch tracking, CSV error report download, and batch history
- `backend/routes/onboarding.routes.js` — staff & student onboarding routes guarded by `requireVerifiedEmail`
- `backend/routes/public.routes.js` — `/set-password/:token` public endpoints for staff password creation
- `client-next/app/set-password/[token]/page.js` & `_client.js` — branded staff password setup page with token verification, real-time validation, and show/hide toggles
- `client-next/app/onboarding/page.js` — interactive Step 3 (Staff Accounts with Single Invite & Bulk CSV tabs, staff roster with Resend button), Step 4 (Student Bulk Enrollment with Dynamic Template download, drag & drop CSV upload, preview table, progress bar, error report download), and Step 6 (Readiness matrix)
- `backend/tests/phase6_staff_student.test.js` — comprehensive test suite covering all 7 test cases ✅

**Acceptance status:**
- ✅ Single staff creation dispatches secure invitation token with 3-day expiry; duplicate emails rejected.
- ✅ Bulk staff CSV import processes multiple team accounts with role validation.
- ✅ Staff invitation resend refreshes token with new 3-day expiration.
- ✅ `/set-password/:token` validates token, returns college branding, sets bcrypt password, and guarantees single-use.
- ✅ Student dynamic CSV template reflects current session, classes, and sections.
- ✅ Student bulk import creates records, skips duplicate admission numbers idempotently, and logs validation errors in `ImportBatchRow`.
- ✅ Downloadable CSV error audit report details exact row numbers and error messages for any skipped or failed rows.
- ✅ All unit tests pass with zero regressions (`phase6_staff_student.test.js` and `phase5_onboarding.test.js` exit 0).


## Decisions already made (from you)
- Stack: Next.js (Hostinger now, own VPS later) · Express on Render · PostgreSQL on Neon · Cloudflare R2 (existing upload service) · existing announcement service · existing activity log.
- College code = its subdomain slug (e.g. `fmc`). College profile, apply routes and login live on `{slug}.collegeshub.org`.
- One super admin, panel + login on `admin.collegeshub.org`. Root `/login` asks for a code: a college code goes to that college's subdomain, the super admin code goes to `admin.collegeshub.org`.
- Manual subscriptions (no online payment). Reminders 30/14/7/1 days, 7-day grace, then `suspended`.
- Super admin messages to college admin/principal reuse the existing announcement service, plus optional email, with delivery status stored.

## Assumptions I made (change them if wrong)
- The college code equals the slug. The super admin code is a **routing hint only** (stored in an env var), never a replacement for password login. Rate-limit it; consider 2FA (TOTP) for the super admin later.
- Mail provider: Resend (or Brevo) behind one `mailService` wrapper. If you already send email, the AI must reuse that.
- Hosting: Hostinger web/cloud plans give per-subdomain SSL but wildcard SSL is VPS-only, so the default is **Cloudflare DNS with a proxied `*` record in front of the Hostinger origin**. Phase 2 starts with a spike to confirm the origin accepts any `*.collegeshub.org` hostname. If it cannot, fall back to a VPS (Caddy/Nginx + wildcard certificate). Application code stays host-agnostic either way.
- Render free instances sleep, so scheduled jobs use a **Render Cron Job** (or an external scheduler calling a secret-protected endpoint), not `node-cron` inside the web service.

---

# SHARED CONTEXT (paste at the top of every phase prompt)

~~~text
You are a senior full-stack architect and engineer working on COLLEGESHUB (Collegeshub.org), a multi-tenant college management + LMS platform. The product was previously named "Academix": never show that old name anywhere; the name is "Collegeshub".

STACK (fixed, do not change or add alternatives)
- Frontend: Next.js App Router, React, Tailwind v4, React Query, zustand (useAuthStore), react-icons/hi, axios instance at lib/api. Hosted on Hostinger now (will move to an own VPS later) → no Vercel-only features.
- Backend: Node.js + Express, hosted on Render, public API at api.collegeshub.org.
- Database: PostgreSQL on Neon. Tenancy = shared schema with a college_id column. Use the project's EXISTING DB access layer and migration tool; do not introduce a new ORM or migration tool.
- Files: Cloudflare R2 through the EXISTING upload service. Reuse it exactly as the rest of the app does. Never write new storage code.
- Existing services to reuse, not duplicate: upload service (R2), announcements service (college admin/principal → students/teachers), activity-log service, auth/JWT middleware, college feature gating (college.subscription.features / effectiveFeatures), subscription-requests module in super admin, academic setup services (sessions, classes, sections, subjects), student/staff creation services. If a mail service exists, reuse it; otherwise create a thin `mailService.send({to, subject, html, text})` wrapper so the provider can be swapped.
- Roles: superAdmin, admin, principal, registrar, accountant, teacher, student, employee. There is exactly ONE super admin today; keep the code generic (role-based, record actor ids) so more can be added later.

DOMAIN ARCHITECTURE
- collegeshub.org → marketing, public college directory at /college, root /login (code entry), subscription request form.
- {slug}.collegeshub.org (e.g. fmc.collegeshub.org) → that college's public profile at "/", admission routes (/apply/…), /login, /setup/<token>, /verify-email, /onboarding, and all role panels after login.
- admin.collegeshub.org → super admin login and panel only (existing /super-admin/* routes).
- api.collegeshub.org → Express API on Render.
- Reserved (never assignable as slugs): www, app, api, admin, mail, status, support, help, docs, blog, cdn, static, assets, dev, test, staging, root, collegeshub, college, login, register, dashboard, super-admin, superadmin, ns1, ns2, ftp, smtp, imap, pop, billing, account.
- Slug rules: ^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$, lowercase, unique index, immutable once assigned.

GLOBAL ENGINEERING RULES
1. Additive, reversible DB migrations with explicit backfill. Existing colleges are backfilled to status 'active' and keep their existing public slug. Nothing existing may break.
2. Every state change is validated on the server with a strict transition table, runs in a DB transaction, is idempotent (double-click/retry safe), and writes an activity-log entry (actor, action, college/request id, before→after).
3. Tenant isolation: the tenant always comes from the authenticated user's token (college_id), never from the hostname/header alone. Every query on tenant data filters by college_id.
4. Security: secrets/tokens only stored hashed (SHA-256) and compared in constant time; tokens never logged; rate-limit every public or sensitive endpoint; generic error messages for auth failures; validate all input with the project's existing validation approach.
5. Email is sent through the mail wrapper; a failed send must never roll back a business action — store delivery status and provide a retry.
6. Frontend: follow the Collegeshub design system (globals.css tokens and classes: page, page-head, card, stat-card, btn-primary/secondary/danger, input-field, field-label, form-grid, badge-*, table-wrap, data-table, modal-overlay/modal-content, empty, skeleton). No hard-coded colours (use tokens only; light and dark must work), mobile-first at 360px, no outer page padding inside pages (the layout owns it), touch targets ≥ 40px, loading/empty/error states for every data view, aria-labels on icon-only buttons.
7. Do not invent features outside the phase. Do not rename existing endpoints/fields unless the phase says so; if you must change a response shape, keep backward compatibility.
8. If a file you need was not pasted, DO NOT guess: list exactly which files you need and stop.
9. Interactive Confirmation & Alignment: Before initiating or executing any phase, or whenever clarifications/trade-offs arise, ask the user first. Present clear options starting with `(Recommended) Option 1: ...`, followed by `Option 2: ...`, and `Option 3: ...` if available.

OUTPUT FORMAT (every phase)
(1) SQL migration (up + down) · (2) all new/changed backend files, complete · (3) all new/changed frontend files, complete · (4) new env vars with example values · (5) test checklist with example curl commands · (6) short summary, then "Existing behaviour unchanged: yes/no (explain)", plus a list of anything assumed or left for a later phase.
~~~

---

# PHASE 0 — Foundations and schema groundwork

~~~text
[Paste SHARED CONTEXT]

PHASE 0 GOAL: prepare the database, config and helpers every later phase depends on. No user-facing features yet.

DATABASE (additive migration + backfill)
- colleges: add slug (text, unique, lowercase, NOT NULL after backfill), status enum('pending_setup','onboarding','active','suspended') default 'pending_setup', onboarding_state jsonb default '{}', activated_at timestamptz null, plus the public-profile columns: tagline, about, address, city, phone, email, website, social_links jsonb, established_year int, affiliation text, logo_key, cover_key (R2 object keys), gallery jsonb (array of {key, caption}).
- Backfill: every EXISTING college → status 'active', activated_at = now(), slug = its current public profile slug (the one used at collegeshub.org/college/<slug>); if a slug is missing, derive from the name, resolve collisions with a numeric suffix, never hit the reserved list.
- Add a CHECK/unique index so slugs are unique case-insensitively.
- A small `reserved_slugs` constant module on backend AND frontend (same list) + `isValidSlug(slug)` helper.

BACKEND
- config: env vars ROOT_DOMAIN (collegeshub.org), APP_URL scheme, MAIL_FROM, MAIL_API_KEY, SUPER_ADMIN_ROUTING_CODE, CRON_SECRET.
- mailService wrapper (reuse existing if present) with HTML+text templates helper using Collegeshub branding (logo blue #0A4D94, green #299A49, ".org" in green).
- rateLimit helper (per IP + per key) reusable by later phases.
- securityHeaders: Referrer-Policy: no-referrer for token pages.
- Utility: generateToken() → {token (32 random bytes hex), hash (sha256)}; verifyTokenHash(token, hash) constant-time.

ACCEPTANCE
- Migration runs on a copy of production data; every existing college has status 'active' and a valid unique slug; existing public profile URLs still work.
- isValidSlug rejects reserved/invalid/too short/too long.
- generateToken/verify have unit tests.

FILES TO PASTE: current colleges table definition/migrations, the code that serves public college profiles, your DB access layer + migration tool config, existing mail/rate-limit code if any.
~~~

---

# PHASE 1 — Subscription request lifecycle (super admin)

~~~text
[Paste SHARED CONTEXT]

PHASE 1 GOAL: super admin can move a subscription request through new → contacted → rejected (approved is wired in Phase 3, so show the Approve button disabled with tooltip "Available after setup is complete" or hide it behind a flag).

STATUS MACHINE (server-enforced)
new → contacted | rejected ; contacted → rejected ; contacted → approved (Phase 3) ; rejected → contacted (re-open, requires a note) ; approved is terminal. Any other transition = 409 with a clear message.

DATABASE
- subscription_requests: add status enum('new','contacted','approved','rejected') default 'new' (existing rows → 'new'), contacted_at, contacted_by, rejected_at, rejected_by, rejection_reason, internal_notes.
- subscription_request_events (id, request_id, type, from_status, to_status, note, actor_id, created_at) → powers the timeline.

BACKEND (super admin only)
- PATCH /super-admin/subscription-requests/:id/contact  {note?}
- PATCH /super-admin/subscription-requests/:id/reject   {reason (required, 5–500 chars), notifyRequester?: boolean}
- POST  /super-admin/subscription-requests/:id/notes    {note}
- GET   list with filters (status, search by college/contact name/email/phone, date range), pagination, counts per status; GET one with its events.
- Optional rejection email to the requester through mailService (polite template, no internal notes). Delivery failure must not roll back the rejection.
- Activity-log entry on every action.

FRONTEND (existing super admin "Subscription Requests" page, redesigned with the design system)
- Status tabs with counts (All / New / Contacted / Approved / Rejected), search, mobile card list + desktop table.
- Row/detail actions: Mark Contacted (modal with optional note), Reject (modal with required reason + "email the requester" checkbox), Add note, Approve (disabled for now).
- Detail drawer/page: requester info, current status badge, vertical timeline of events (who/when/note).
- Optimistic UI is NOT allowed for status changes; refetch after success and show the server error message on failure.

ACCEPTANCE
- Valid transitions work; invalid ones return 409 and the UI shows the message.
- Double-clicking "Mark contacted" creates only one event.
- Timeline shows every action with actor and time; page works at 360px with no horizontal scroll.

FILES TO PASTE: existing subscription-requests routes/controller/model, the super admin subscription requests page component(s), super admin auth middleware.
~~~

---

# PHASE 2 — Subdomain infrastructure and routing

~~~text
[Paste SHARED CONTEXT]

PHASE 2 GOAL: make {slug}.collegeshub.org and admin.collegeshub.org work from ONE frontend deployment and ONE API, with branded login, the code-entry login and the redirect rules. No onboarding yet.

STEP 0 — HOSTING SPIKE (deliver a short written result first)
Verify whether the current Hostinger plan can serve any *.collegeshub.org hostname from the same Next.js app, and how HTTPS works. Default plan: DNS on Cloudflare, proxied wildcard record "*" and "admin" pointing to the origin, Cloudflare edge certificate covering *.collegeshub.org; origin accepts any Host. If the Hostinger plan cannot do this, document the fallback (own VPS with Caddy or Nginx + wildcard certificate via DNS-01) and keep the app code identical. Include the exact DNS records and the env vars (NEXT_PUBLIC_ROOT_DOMAIN).

FRONTEND
- middleware (named "proxy" in the newest Next.js; use whichever this project's Next.js version expects) reads the Host header and classifies it:
  * root host (collegeshub.org / www): marketing, /college directory, /login (code entry), subscription request form. The old /college/<slug> URL responds 308 → https://<slug>.collegeshub.org/.
  * admin host (admin.collegeshub.org): only /login and /super-admin/*; "/" redirects to /super-admin (or /login if signed out). Tenant routes are not served here.
  * tenant host (<slug>.…): public profile at "/", admission routes at /apply/… (move the existing apply routes here and 308 the old URLs), /login, /setup/<token>, /verify-email, /onboarding (Phase 5), and all role panels. /super-admin/* is NOT served on tenant hosts (404).
  * unknown slug (public tenant lookup returns 404) → friendly "College not found" page with a link to the directory.
- helper getTenantSlug()/getHostType() usable on server and client; ROOT_DOMAIN from env; local dev works with fmc.localhost:3000 and admin.localhost:3000.
- Public directory (collegeshub.org/college): each college card/link now goes to https://<slug>.collegeshub.org.
- Tenant home "/" = the public college profile (logo, cover image, tagline, about, address/city, contacts, website, social links, established year, affiliation, gallery) with "Apply now" and "Login" buttons. Profile fields that are empty are hidden gracefully. Profile is public only when college status is 'active'; otherwise show a "This college is getting ready" page.
- Root /login: one field "College code". On submit call the resolve endpoint → redirect to https://<slug>.collegeshub.org/login or https://admin.collegeshub.org/login. Never reveal whether a code exists beyond "Invalid code".
- Tenant /login: branded with the college logo/name from the public tenant endpoint. Admin host /login: plain Collegeshub branded super admin login.
- After login, if the user's college slug does not match the current host (or a non-super-admin is on the admin host / super admin on a tenant host), sign out and redirect to the correct host with a clear message.
- Session lives per origin (token in the existing auth store). Do NOT use cookies shared across subdomains.

BACKEND
- GET /public/tenant/:slug → {name, slug, logoUrl, status, publicProfileFields…} (404 if unknown). Cache briefly. Never returns internal data.
- POST /public/resolve-code {code} → {type:'college', slug} | {type:'super-admin'} | 404 generic. Compare the super admin code in constant time against SUPER_ADMIN_ROUTING_CODE; strict rate limit (e.g. 10/min/IP); identical response timing for found/not found. The code is only a routing hint, never authentication.
- POST /auth/login: accept the tenant slug from the request (header X-Tenant-Slug sent by the frontend) and reject with a generic "Invalid credentials" if the user's college slug differs; super admin credentials only succeed from the admin host (X-Host-Type: admin) and are rejected on tenant hosts, and vice versa.
- CORS: dynamic origin check allowing https://collegeshub.org, https://admin.collegeshub.org and https://<valid-slug>.collegeshub.org (validated against slug rules, not a loose wildcard), credentials not required (Authorization header auth).

ACCEPTANCE
- fmc.collegeshub.org shows FMC's profile; admin.collegeshub.org shows only super admin login; an unknown slug shows "College not found".
- A college admin cannot log in on another college's subdomain or on the admin host.
- /college/fmc redirects to fmc.collegeshub.org; old apply URLs redirect to the subdomain.
- Wrong code → generic message; rate limit triggers.

FILES TO PASTE: next.config, existing middleware (if any), root + public college pages/routes, apply routes, login page, auth store, lib/api, CORS config, auth controller/routes.
~~~

---

# PHASE 3 — Approval, provisioning and invite email

~~~text
[Paste SHARED CONTEXT]

PHASE 3 GOAL: when super admin approves a request, the college is provisioned with its subdomain and an invite email with a unique one-time link is sent. (Depends on Phases 0, 1, 2.)

DATABASE
- college_invites (id, college_id, email, token_hash, expires_at, used_at, revoked_at, created_by, created_at, email_status enum('queued','sent','failed'), email_error).
- Subscription basics at approval: use the existing subscription structure; create the first subscription period row with plan, feature list and starts_at/expires_at (full management comes in Phase 9, so keep it a simple insert via a function Phase 9 will reuse).

BACKEND
- GET /super-admin/slugs/check?slug=… → {available, reason?} (validity, reserved, taken).
- POST /super-admin/subscription-requests/:id/approve {collegeName, slug, adminEmail (default: requester email), plan, features[], startsAt, expiresAt}: in ONE transaction → validate transition (only from 'contacted'; allow from 'new' only if a flag you define says so) → create college (status 'pending_setup', slug) → create first subscription period → create invite (generateToken, 7-day expiry, single use) → mark request approved → log. After commit, queue the invite email; on failure set email_status 'failed' (approval stays valid).
- Invite email: branded HTML + plain text, greeting with college name, big button to https://<slug>.collegeshub.org/setup/<token>, expiry notice, support contact. The raw token exists only in the email URL.
- POST /super-admin/colleges/:id/invite/resend (revokes the previous valid invite, creates a new one, emails it) · POST /super-admin/colleges/:id/invite/revoke · GET invite status for the college.
- Idempotency: approving twice returns the same result without creating a second college or sending a second email.

FRONTEND (super admin)
- Approve modal (stepped on mobile): college name, subdomain field with live availability check (debounced) showing "fmc.collegeshub.org", admin email, plan/feature checklist, start and expiry dates. Confirm screen summarises before submitting.
- Requests list/detail show "Approved" with college link; Colleges list/detail shows invite status (Sent / Failed / Used / Expired / Revoked) with Resend and Revoke buttons and the email-failed retry.

ACCEPTANCE
- Approval creates exactly one college in 'pending_setup', one invite, one email; slug conflicts are blocked in the UI and on the server.
- Resend invalidates the old link; a revoked/expired link fails (tested in Phase 4).
- Email send failure shows "Email failed — Retry" and does not undo approval.

FILES TO PASTE: subscription-requests + colleges controllers/models, existing subscription/feature code, mailService, super admin pages for requests and colleges.
~~~

---

# PHASE 4 — Accept invite and verify email

~~~text
[Paste SHARED CONTEXT]

PHASE 4 GOAL: the college admin opens the invite link, creates the admin account and verifies the email. (Depends on Phase 3.)

BACKEND (public, rate-limited)
- GET /public/invites/:token → {valid:true, collegeName, slug, email} or a generic {valid:false, reason:'expired'|'used'|'revoked'|'invalid'} (only the reason class, no internal data).
- POST /public/invites/:token/accept {fullName, password, confirmPassword}: password policy (min 10 chars, not in a small common-password list, not equal to email), then in ONE transaction: re-validate token → create the user (role 'admin', college_id, email from the invite, email_verified=false) → atomically consume the invite with UPDATE … WHERE used_at IS NULL AND revoked_at IS NULL AND expires_at > now() (zero rows = already used) → set college status 'onboarding' → create the email verification code → log. Return a normal session (same shape as login).
- email_verifications table (user_id, code_hash, expires_at, attempts, last_sent_at). 6-digit numeric code, 15-minute expiry, max 5 attempts, resend cooldown 60 s, max 5 sends per hour.
- POST /auth/verify-email {code}, POST /auth/resend-verification.
- Middleware requireVerifiedEmail applied to: create/import users, staff and student import endpoints, and the launch endpoint.
- Tenant check: the invite's college slug must match X-Tenant-Slug.

FRONTEND (tenant host, standalone pages in the onboarding visual style: no sidebar, centered card on mobile edge-to-edge)
- /setup/[token]: loads invite state; friendly states for expired/used/revoked/invalid with "contact Collegeshub support"; form with show/hide password and strength hint; success → /verify-email.
- /verify-email: 6-box code input (paste supported, numeric keyboard), resend with countdown, error and lockout states; success → /onboarding.
- Route guard: an unverified admin can only see /verify-email.
- Set Referrer-Policy: no-referrer on /setup.

ACCEPTANCE
- A valid link creates exactly one admin; reusing it fails cleanly; two simultaneous submissions create only one account.
- 6 wrong codes lock verification until the cooldown; resend works.
- An unverified admin cannot call any create-user endpoint (403 with a clear code).

FILES TO PASTE: user model/auth controller, login page, auth store, route guards, mailService.
~~~

---

# PHASE 5 — Onboarding shell, college profile and academic setup

~~~text
[Paste SHARED CONTEXT]

PHASE 5 GOAL: a guided, very simple onboarding for the college admin: shell + progress saving + college profile (with images) + academic setup. (Depends on Phase 4.)

ONBOARDING STATE
- colleges.onboarding_state jsonb: {currentStep, steps:{verify:'done'|'todo', profile, academic, staff, students, review}, updatedAt}. GET /admin/onboarding and PATCH /admin/onboarding/steps/:step. Server decides "done" from real data, not from the client.
- Route guard (frontend + backend): while college.status = 'onboarding' the admin is forced to /onboarding; other roles of that college cannot log in ("College setup is not finished yet"). Active colleges never see onboarding except the checklist widget (Phase 7).

FRONTEND LAYOUT
- OnboardingLayout: no sidebar; Collegeshub logo, a stepper (horizontal dots on mobile, labelled steps on desktop), percent progress, "Save and continue later", one task per screen, big primary button, a short "Why we ask" help box on every step, plain language, Back/Next. Fully mobile-first and light/dark ready.

STEP: COLLEGE PROFILE
- Fields: college name (editable), tagline (≤120 chars), about (≤1500 chars, plain text), address, city, phone, public email, website (URL validated), social links (Facebook, Instagram, YouTube, X/Twitter, LinkedIn, WhatsApp; each optional URL), established year (1800..current year), affiliation/board (text or select from existing options if the app has them).
- Images, using the EXISTING upload service the app already uses for R2 (same flow, same helpers):
  * Logo: ≤ 1 MB, PNG/JPG/WebP, auto-resized to max 512 px, square-friendly crop preview.
  * Cover image: ≤ 3 MB, JPG/PNG/WebP, auto-resized to 1600 px wide (16:9 crop preview).
  * Gallery: up to 8 images, ≤ 2 MB each, auto-resized to 1600 px, optional captions, reorder and delete.
  * Validate type, size and real image content on the server; store only the R2 keys; reject SVG uploads for logo/cover/gallery unless the existing service already sanitises them. Resize on the server if the existing service supports it, otherwise client-side before upload plus server validation of the final size.
- Live "How your public page will look" preview that reuses the SAME public-profile component Phase 2 renders on the tenant home page.
- The profile step is "done" when name, city, phone or email, and logo exist (the rest is optional but encouraged).

STEP: ACADEMIC SETUP
- Create the first academic session, classes with sections, and subjects using the existing academic services/endpoints (do not duplicate logic). Offer quick-start presets (e.g. Matric 9–10, Intermediate, BS programs) that pre-fill classes/subjects the admin can edit before saving.
- "Done" when ≥ 1 session and ≥ 1 class exist.

ACCEPTANCE
- Closing the browser and returning resumes on the right step; progress % matches real data.
- Images over the limits or of wrong types are rejected with friendly messages; resized images land in R2 via the existing service.
- Preview matches the real public profile; works at 360px.

FILES TO PASTE: upload service + an example of its use, public profile component(s) from Phase 2, academic services/controllers/pages, route guards, design-system class list (globals.css).
~~~

---

# PHASE 6 — Staff accounts and bulk student import

~~~text
[Paste SHARED CONTEXT]

PHASE 6 GOAL: simple pages to add staff and import students. (Depends on Phase 5. Both require a verified admin email.)

STAFF
- Roles: principal, registrar, accountant, teacher (faculty), employee. Add one by one (name, email, phone, role, optional designation) or via CSV with a downloadable template; show a preview table with per-row errors before saving.
- Each new user gets a "set your password" email (hashed single-use token, 3-day expiry) instead of an emailed password; page /set-password/[token] on the tenant host. Resend invitation action.
- Duplicate emails inside the college are skipped and reported. Enforce plan limits only if the app already has them.
- Uses the existing staff/user creation services (don't duplicate role/permission logic).

STUDENTS
- Download a template (CSV and XLSX if the project already has an xlsx library; otherwise CSV only). Columns taken from the existing student model (name, father name, class, section, admission number, date of birth, gender, phone, email/guardian contact, address…). Map class/section by name against the classes created in Phase 5 and report unknown ones.
- Client-side parse and preview (valid / warning / error counts, first 50 rows, error list), then upload in chunks of 200–500 rows. The server RE-VALIDATES every row, never trusts the client.
- Dedupe: unique per college by admission number (and email when present); re-running the same file is safe (idempotency via an import_batch id + row hash). Each chunk runs in its own transaction.
- Per-row results are stored: import_batches (id, college_id, created_by, filename, total, created, skipped, failed, status) and import_batch_rows (batch_id, row_no, status, message). The UI shows progress and offers "Download error report (CSV)".
- Student invitation emails are optional: default "Invite later"; if enabled, queue them throttled (e.g. 30/min).
- Reuse the existing student creation logic (admission number rules, fee assignment hooks) by calling the existing service per row.

FRONTEND
- Onboarding steps "Staff" and "Students": clear instructions, template download, drag-and-drop/file picker, preview, progress bar, results summary with counts, error report, "Skip for now". Mobile-friendly (cards instead of wide tables on phones).

ACCEPTANCE
- A 1,000-row file with deliberately bad rows imports the good rows, reports the bad ones accurately, and re-importing creates no duplicates.
- An unverified admin gets 403 on these endpoints.
- Staff receive set-password emails and can log in only after the college is active (Phase 7 gating).

FILES TO PASTE: existing student/staff controllers and services, student model fields, existing CSV/XLSX libs in package.json, existing admin staff/student pages.
~~~

---

# PHASE 7 — Review, launch and gating

~~~text
[Paste SHARED CONTEXT]

PHASE 7 GOAL: finish onboarding and mark the college active. (Depends on Phases 5–6.)

BACKEND
- GET /admin/onboarding/review → checklist from REAL data: required (email verified, profile done, ≥1 session, ≥1 class) and optional (logo/cover/gallery, staff added, students imported).
- POST /admin/onboarding/launch: re-check all required items on the server; in one transaction set status 'onboarding' → 'active', activated_at = now(), mark steps done; log; notify the super admin (in-app notification/announcement entry) and send the admin a welcome email. Idempotent.
- Login gating: users of colleges with status 'pending_setup'/'onboarding' (except the admin during onboarding) get a friendly "College setup not finished" response. 'suspended' is handled in Phase 9.
- The public profile becomes visible when status is 'active'.

FRONTEND
- Review & Launch screen: green/amber checklist with links back to each step, a clear "Launch my college" button disabled until required items pass, celebratory success state, then redirect to the admin dashboard.
- Dashboard "Setup checklist" widget for optional leftovers (progress bar + links), dismissible when all done.
- Super admin colleges list: status badge (pending setup / onboarding / active / suspended), onboarding progress %, days since invite, last activity.

ACCEPTANCE
- Launch is refused with a clear list if required items are missing; after launch staff can log in and the public profile is live; existing active colleges are unaffected.

FILES TO PASTE: onboarding controller/state code from Phase 5, login/auth middleware, admin dashboard page, super admin colleges list page.
~~~

---

# PHASE 8 — Hardening, testing and operations

~~~text
[Paste SHARED CONTEXT]

PHASE 8 GOAL: make the whole flow safe and observable.

BACKEND/OPS
- Rate limits and lockouts verified on: /public/resolve-code, /public/invites/*, /auth/login, /auth/verify-email, /auth/resend-verification, password-set endpoints.
- Cross-tenant test suite: automatically iterate the API routes with tenant data and prove that a user of college A cannot read or write college B (list, get by id, update, delete, import, upload keys). Report any route that fails and fix it.
- Scheduled jobs through a Render Cron Job (or secret-protected endpoint called by an external scheduler; header X-Cron-Secret = CRON_SECRET): (a) stalled-onboarding nudge emails at 3 and 7 days after the invite was used, (b) invite-expiry reminder to super admin 1 day before expiry, (c) cleanup of expired/used tokens and verification codes.
- Email deliverability checklist for collegeshub.org: SPF, DKIM, DMARC records, a dedicated sending subdomain if the provider recommends it, bounce/complaint handling stores failures in delivery status.
- Log scrubbing (no tokens, codes, passwords or full emails in logs), security headers (HSTS, X-Content-Type-Options, frame-ancestors), Referrer-Policy: no-referrer on token pages.
- Neon backup/restore note (branching or point-in-time restore), and a runbook for: "invite never arrived", "college stuck in onboarding", "wrong slug assigned".

FRONTEND
- Consistent error pages (expired link, college not found, suspended, setup not finished) in the design system.

ACCEPTANCE
- The cross-tenant suite passes; rate limits trigger as configured; cron jobs run idempotently; a runbook document exists.

FILES TO PASTE: Express app bootstrap, all route files, existing test setup, render.yaml/deploy config.
~~~

---

# PHASE 9 — Subscription management and messages (super admin) — ✅ DONE (9/9 tests passed)

~~~text
[Paste SHARED CONTEXT]

PHASE 9 GOAL: super admin manages each college's subscription and communicates with its administration, all from the college detail page. Manual payments only. (Depends on Phases 3 and 7.)

DATABASE
- subscription_periods (id, college_id, plan, features jsonb snapshot, starts_at, expires_at, status enum('scheduled','active','expired','cancelled'), amount_note, payment_note/reference, created_by, created_at, reason). History is NEVER overwritten; every change is a new row or a logged edit.
- colleges: subscription_status derived/cached enum('active','grace','suspended'), grace_until, feature_overrides jsonb (super admin overrides on top of the plan).
- message_deliveries (id, college_id, announcement_id, recipient_user_id, channel enum('in_app','email'), status enum('queued','sent','failed'), error, sent_at).
- effectiveFeatures = features of the current active period + overrides (extend the existing computation; keep its current output shape so feature gating keeps working).

BACKEND (super admin only, all logged)
- GET /super-admin/colleges/:id/subscription → current period, status, days left, history.
- POST …/subscription/assign {plan, features, startsAt, expiresAt, amountNote, paymentNote}
- POST …/subscription/renew {extendFrom: 'current_expiry'|'today', months or newExpiry, amountNote, paymentNote}
- PATCH …/subscription/expiry {newExpiry, reason (required)}
- PATCH …/subscription/features {overrides}
- POST …/suspend {reason} and POST …/reactivate
- Daily cron (secret-protected): reminders to the college admin by email + in-app at 30/14/7/1 days before expiry (each sent once, tracked); at expiry → status 'grace' for 7 days with an in-app banner for all roles; after grace → 'suspended'.
- Suspended behaviour: college admin can log in but only sees a "Subscription expired — contact Collegeshub" page (with renewal contact); principal, teachers, students and all other roles are blocked with a clear message; no data is deleted; public profile shows a neutral "temporarily unavailable" notice. Reactivation/renewal restores everything immediately.
- Messages: POST /super-admin/colleges/:id/messages {subject, message, channel: 'in_app'|'email'|'both', recipients: 'admin'|'principal'|'both'}. In-app notices REUSE the existing announcements service (audience = that college's admin and/or principal only; never students/teachers). Email goes through mailService. Store one message_deliveries row per recipient and channel; GET …/messages returns history with delivery status and a Retry for failed emails.

FRONTEND (super admin → College detail page, new "Subscription" and "Messages" tabs)
- Subscription tab: current plan card (plan, status badge, expiry date, days-left progress), actions (Assign, Renew, Edit expiry, Edit features, Suspend/Reactivate) in modals with required reason where noted, history table (cards on mobile).
- Messages tab: "Send message" modal (subject, message, channel, recipients), history list with per-recipient delivery status and retry.
- College admin side: expiry banner during the 30-day window and grace period; the "Subscription expired" page for suspended colleges; both use the design system.
- Colleges list: expiry date column, "expiring soon" filter, status badges.

ACCEPTANCE
- Renewing extends correctly from either base date and keeps history; editing expiry requires a reason and is logged.
- Reminders are sent once per threshold; grace → suspended transitions happen automatically; renewal after suspension restores access instantly.
- A message with "both" creates the in-app announcement for admin/principal only and the emails, with delivery statuses recorded.

FILES TO PASTE: existing subscription/feature code and effectiveFeatures logic, announcements service + routes, super admin college detail page, login/auth middleware, mailService, cron setup from Phase 8.
~~~

---

## Quick checklist before you start
- [ ] Phase 0 migration tested on a copy of production data.
- [ ] Cloudflare DNS plan decided (and Hostinger wildcard spike done in Phase 2).
- [ ] Mail provider account created and `collegeshub.org` SPF/DKIM/DMARC records added.
- [ ] `SUPER_ADMIN_ROUTING_CODE` chosen (long, not guessable) and stored only in the backend environment.
