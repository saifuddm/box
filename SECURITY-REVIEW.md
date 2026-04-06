# Box Security Review

**Date:** 2026-04-05  
**Scope:** Password flows, JWT auth, Supabase RLS, content access controls

---

## Auth Flow Overview

```
User enters password
  -> POST /api/box-auth (Next.js route)
    -> Supabase Edge Function "box-auth" (verifies SHA-256 hash)
    <- Returns authenticated: true
  <- Creates JWT (HS256, signed with BOX_TOKEN_SECRET)
  <- Sets HTTP-only cookie: box_token_{boxId}

Subsequent requests (upload, fetch content, storage URLs)
  -> Read cookie -> Verify JWT (scope, sub, exp) -> Proceed with service_role
```

Content is fetched **server-side only** after token validation. No content leaks to the client before authentication.

---

## Critical Severity

### 1. SHA-256 Password Hashing (No Salt)

**Files:**
- `supabase/functions/box-auth/index.ts`
- `supabase/functions/create-box/index.ts`

**Problem:** Passwords are hashed with plain SHA-256 — no salt, no key stretching. This is a fast hash designed for data integrity, not password storage.

**Impact:**
- Identical passwords always produce the same hash
- Vulnerable to rainbow table attacks
- If the database is compromised, passwords are trivially crackable

**Recommendation:** Replace with bcrypt, Argon2, or PBKDF2 with a random per-password salt. Migration needed to rehash existing passwords.

---

### 2. No Rate Limiting on Password Attempts

**Files:**
- `supabase/functions/box-auth/index.ts`
- `src/app/api/box-auth/route.ts`

**Problem:** No limit on how many password attempts can be made against a box. An attacker can brute-force passwords at network speed.

**Impact:**
- Short or common passwords can be cracked quickly
- No lockout or throttling mechanism exists

**Recommendation:** Implement per-boxId rate limiting (e.g., 5 attempts per minute, exponential backoff). Could be done at the edge function level or via Supabase rate limiting.

---

### 3. Weak Authorization in box-cleanup — FIXED

**File:** `supabase/functions/box-cleanup/index.ts`

**Problem:** Authorization check uses `authHeader.includes(serviceRoleKey)` — a substring match rather than exact comparison.

**Impact:**
- Could potentially be bypassed by embedding the key within a larger string
- Cleanup function could be triggered by unauthorized parties

**Recommendation:** Use strict equality (`===`) or proper JWT-based verification.

**Fix:** Changed to strict equality: `authHeader !== \`Bearer ${serviceRoleKey}\``.

---

## High Severity

### 4. Timing Attack on Hash Comparison — FIXED

**File:** `supabase/functions/box-auth/index.ts`

**Problem:** Password hash comparison uses JavaScript `===` operator, which short-circuits on first mismatched character. This leaks timing information.

**Impact:** An attacker making many requests could statistically determine how many leading characters of the hash match, narrowing down the password.

**Recommendation:** Use a constant-time comparison function (e.g., `crypto.timingSafeEqual` or equivalent in Deno).

**Fix:** Added `constantTimeEqual()` function using XOR-based byte comparison.

---

### 5. CORS Allows All Origins — FIXED (partial: create-box intentionally open)

**Files:** All Supabase edge functions (`box-auth`, `create-box`, `get-box-content`, `get-storage-content`, `box-cleanup`, `tutorial-box`)

**Problem:** All edge functions set `Access-Control-Allow-Origin: *`.

**Impact:** Any website can make cross-origin requests to these functions. While JWT tokens are in HTTP-only cookies (not sent cross-origin by default), the create-box and tutorial-box functions have no auth requirement.

**Recommendation:** Restrict CORS to your known domains or use credentials-based approach.

**Fix:** `box-auth`, `tutorial-box`, `box-cleanup`, `get-box-content`, and `get-storage-content` now read `ALLOWED_ORIGIN` from env (falls back to `*` if unset for local dev). `create-box` remains open by design to support anonymous/automated box creation. Set `ALLOWED_ORIGIN=https://box.saifuddm.work` as a Supabase secret in production.

---

### 6. SameSite Not Set on Auth Cookies — FIXED

**File:** `src/app/api/box-auth/route.ts`

**Problem:** The `box_token_{boxId}` cookie does not set the `SameSite` attribute.

**Impact:** Browser defaults vary. Without explicit `SameSite=Strict` or `SameSite=Lax`, the cookie may be sent on cross-site requests, enabling potential CSRF attacks.

**Recommendation:** Add `sameSite: 'strict'` to cookie options.

**Fix:** Added `sameSite: "strict"` to cookie options.

---

## Medium Severity

### 7. No Password Strength Validation

**File:** `supabase/functions/create-box/index.ts`

**Problem:** Any string is accepted as a password, including single characters or empty strings (if truthy).

**Impact:** Users can create boxes with trivially guessable passwords.

**Recommendation:** Enforce minimum length (e.g., 8+ characters) at both client and server level.

---

### 8. 23-Hour Cleanup Bug — FIXED

**File:** `supabase/functions/box-cleanup/index.ts`

**Problem:** Uses `setHours(... - 23)` instead of `- 24`, causing boxes to expire one hour early.

**Impact:** Content disappears slightly before the expected 24-hour window.

**Recommendation:** Change `- 23` to `- 24`.

**Fix:** Changed `- 23` to `- 24`.

---

### 9. Console Logging of Signed URLs — FIXED

**Files:**
- `src/components/content/ImageContent.tsx`
- `src/components/content/FileContent.tsx`
- `src/components/content/BoxContent.tsx`

**Problem:** `console.log()` statements output storage paths and signed URLs to the browser console.

**Impact:** Anyone with dev tools open can see temporary access URLs to stored content.

**Recommendation:** Remove or gate behind a debug flag.

**Fix:** Removed all `console.log` statements from client-side code. Supabase Edge Function logs retained (server-side only).

---

## Low Severity

### 10. GET Endpoint on box-auth — FIXED

**File:** `src/app/api/box-auth/route.ts`

**Problem:** GET handler returns "Hello, world!" with a TODO comment to remove it.

**Impact:** Minor information disclosure / unnecessary attack surface.

**Recommendation:** Remove the GET handler.

**Fix:** Removed the GET handler entirely.

---

## Supabase RLS Status

### Current State (Post-Migration 20260311102853)

| Table | RLS Enabled | Anon SELECT | Anon INSERT | Service Role | Notes |
|---|---|---|---|---|---|
| **Box** | Yes | Columns only: `id, name, created_at, password_protected` | Yes (with restrictive policy blocking "tutorial" name) | Full access | `password_hash` not exposed to anon |
| **TextContent** | Yes | Denied (`using(false)`) | Denied (revoked) | Full access | Properly locked down |
| **ImageContent** | Yes | Denied (`using(false)`) | Denied (revoked) | Full access | Properly locked down |
| **FileContent** | Yes | Denied (`using(false)`) | Denied (revoked) | Full access | Properly locked down |

### Storage Buckets

| Bucket | Public | Size Limit | MIME Types | RLS Policies |
|---|---|---|---|---|
| `image-content` | No | 50 MiB | `image/*` | None (app-level gating via signed URLs) |
| `file-content` | No | 50 MiB | `*/*` | None (app-level gating via signed URLs) |

**Note:** Storage access is controlled at the application level through JWT-validated signed URLs. No direct anon access is possible. However, adding explicit storage RLS policies would provide defense-in-depth.

---

## What's Working Well

- HTTP-only, secure cookies for JWT storage (no XSS token theft)
- Server-side rendering gates content behind auth (no client-side content leaks)
- JWT validation on every protected endpoint (scope + boxId checks)
- Signed URLs for storage access (1-hour expiry)
- HTML sanitization on markdown rendering (`rehype-sanitize` + `skipHtml`)
- `password_hash` column not exposed via column-level grants
- Cascade deletes clean up content when boxes are removed
- Progressive security hardening visible in migration history

---

## Priority Fix Order (Suggested)

1. **SHA-256 -> bcrypt/Argon2** (Critical #1)
2. **Rate limiting on auth** (Critical #2)
3. ~~**Fix box-cleanup auth check** (Critical #3)~~ — FIXED
4. ~~**Add SameSite to cookies** (High #6 — quick fix)~~ — FIXED
5. ~~**Constant-time hash comparison** (High #4)~~ — FIXED
6. ~~**Restrict CORS origins** (High #5)~~ — FIXED (create-box intentionally open)
7. **Password strength validation** (Medium #7)
8. ~~**Fix 23h cleanup bug** (Medium #8)~~ — FIXED
9. ~~**Remove console.log statements** (Medium #9)~~ — FIXED
10. ~~**Remove GET handler on box-auth** (Low #10)~~ — FIXED
