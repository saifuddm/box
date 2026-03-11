# Security Follow-ups (Reference)

This is a short reference for the remaining items after locking storage-token flow and content table insert policies.

## 1) Password hashing upgrade

Current password hashing uses plain SHA-256, which is too fast for password protection.

Recommended:
- Switch to `Argon2id` (preferred) or `bcrypt`.
- Store per-box random salt.
- Store algorithm params with hash (memory/time cost, version).
- Add a lazy migration path: on successful login with legacy hash, rehash with Argon2id.

---

## 2) Abuse/rate controls

Add rate limits on:
- `box-auth` (password brute force protection)
- `create-box` (spam/abuse control)
- upload endpoints (storage abuse)

Suggested controls:
- per-IP + per-box counters
- exponential backoff on repeated failures
- basic audit logging for auth failures and unusual request bursts

---

## 3) Text encryption model for password-protected boxes (client-side decrypt)

### Recommended model

For password-protected boxes, use end-to-end style encryption for text content:

1. Client generates random **DEK** (data encryption key) per box/session.
2. Client derives **KEK** (key encryption key) from password using Argon2id/PBKDF2 + salt.
3. Text is encrypted client-side with DEK (AES-GCM).
4. DEK is wrapped/encrypted with KEK and stored as `wrapped_dek` (plus salt/nonce/metadata).
5. DB stores only ciphertext + crypto metadata (no plaintext).
6. On access, user enters password -> client derives KEK -> unwraps DEK -> decrypts text in client.

### About “putting decryption info in token”

Avoid putting raw decryption keys in JWT tokens.

Good use of token:
- auth only (prove access to box),
- optional metadata claims (e.g. `enc_v`, `key_id`),
- optionally authorize fetching encrypted key material.

But the decryption key should come from password-derived material on the client (or from a wrapped key unlocked by that password), not from a bearer token.

### Practical UX note

If you keep “remember for 24h”, store only:
- auth token in HttpOnly cookie, and
- optionally encrypted/wrapped key material in browser storage.

Do **not** store plaintext password or plaintext DEK in persistent storage.
