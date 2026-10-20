# Account management, email verification, and password recovery

## Behavior

- Both existing roles can edit their name and request an email change in Account. Sending a change-email code leaves the current email untouched; only successful confirmation changes it. New emails are normalized to lowercase. PostgreSQL's unique `lower(email)` index prevents case-insensitive duplicates, including concurrent requests.
- Email/password registration returns an unverified account. The registration screen requests a code and displays verification/resend controls. If email delivery is unconfigured, registration still succeeds and the user can sign in and verify later from Account. Verification is informational: it does not gate existing login, jobs, saved jobs, company features, analytics, ingestion, or exports.
- Google authentication keeps the checkout's existing authorization-code popup and server-side ID-token verification. A successful Google login verifies the Mihna email only when it matches Google's verified email. The stable Google subject still identifies returning users after an email change. Gmail/Workspace linking preserves the existing account and role; the existing password confirmation for first-time linking of non-Google-hosted emails remains in place.
- Account displays `has_password`, never a password hash. Google-only accounts can add a password; subsequent changes require the current password. New passwords and confirmations must match, have at least 8 characters, and fit bcrypt's 72-byte UTF-8 limit. Existing password hashing/verification utilities are reused.
- Forgot password has email, code, and new-password steps. The public request returns the same success message for known, unknown, and Google-only addresses. Verification consumes the six-digit code and returns a random, single-use reset token, held only in React memory. Resetting consumes that token and returns the user to ordinary sign-in. A completed reset also verifies the mailbox demonstrated by the code.
- JWT format, signing, storage, expiration, and role authorization are unchanged. Authentication resolves the token's existing `user_id` claim instead of its mutable email subject. Already-issued tokens remain attached to the same user after an email change, even if another user later registers the old address. Tokens continue until their normal expiration after password changes/resets; session revocation is not introduced by this change.

## API

Authenticated endpoints require the existing `Authorization: Bearer <Mihna JWT>` header.

| Method and path                       | Authentication | JSON body                                                          | Result                                        |
| ------------------------------------- | -------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| `PATCH /users/me`                     | Required       | `name`                                                             | Updated public user                           |
| `POST /users/me/password`             | Required       | `new_password`, `confirmation`, `current_password` when one exists | Updated public user                           |
| `POST /users/me/change-email`         | Required       | `email`                                                            | Send new-email code; current email unchanged  |
| `POST /users/me/verify-new-email`     | Required       | `email`, `code`                                                    | Updated public user after verification        |
| `POST /auth/send-verification-code`   | Public         | `email`                                                            | Generic delivery message                      |
| `POST /auth/resend-verification-code` | Public         | `email`                                                            | Generic delivery message; replaces prior code |
| `POST /auth/verify-email`             | Public         | `email`, `code`                                                    | Verification confirmation                     |
| `POST /auth/forgot-password`          | Public         | `email`                                                            | Generic delivery message                      |
| `POST /auth/verify-reset-code`        | Public         | `email`, `code`                                                    | `reset_token`                                 |
| `POST /auth/reset-password`           | Public         | `reset_token`, `new_password`, `confirmation`                      | Reset confirmation, no login JWT              |

`/register`, `/login`, `/auth/google`, and `/me` retain their responsibilities. Public user responses now include `email_verified` and `has_password`. Registration/login compare email case-insensitively; registration enforces bounded names, valid email, and the password policy above. Roles remain `job_seeker` and `company`. No OAuth redirect URI changes are needed.

Validation errors use 422; invalid, expired, or consumed codes use clear 400 messages; duplicate email updates use 409. Request/attempt limits use 429, with `Retry-After` on request limits. Missing mail/verification configuration uses 503 equally for known and unknown email requests. Code-sending APIs acknowledge scheduling, not confirmed inbox delivery.

## Code security and delivery

`auth_codes` stores a purpose-bound HMAC-SHA256 digest of each cryptographically random six-digit code, never the raw code. The HMAC uses a separate backend secret so a database-only disclosure cannot cheaply brute-force all one million possible codes. Codes expire after 10 minutes, allow at most five incorrect attempts, and are consumed once. Issuing a replacement invalidates previous codes and reset grants for that email/purpose. A new email-change request also invalidates earlier change requests for that user.

Reset grants have 256 bits of randomness, are stored only as HMAC digests, expire after 10 minutes, and cannot authenticate as Mihna JWTs. Password changes invalidate outstanding password-reset challenges/grants. Confirmed email changes invalidate all that user's previous challenges/grants. PostgreSQL row locks serialize account mutations and challenge consumption; a single transaction consumes each challenge and applies its change.

`auth_rate_limits` uses atomic database upserts shared by all replicas. Sending is limited to 30 requests/IP/hour, 5/email/hour across purposes, and 1/email/minute window. Authenticated email changes additionally allow 5/user/hour. Verification/password operations allow 120/IP/hour and 30/email-or-account/hour, plus the per-code five-guess limit. These are fixed windows, not exact rolling cooldowns. Keys hash the identity instead of storing raw IP addresses. Unknown addresses follow the same request limits and challenge-storage path. Configure trusted proxy forwarding in Uvicorn so `request.client.host` reflects clients; do not trust arbitrary `X-Forwarded-For` values from public clients.

`email_service.send_email(recipient, subject, body)` is the provider boundary. Its current implementation calls the Brevo transactional email API. A future provider adapter can replace this function without changing routes. Mail is sent through FastAPI background tasks after the database commit and HTTP response. Only redacted delivery-failure messages are logged. Passwords, codes, JWTs, hashes, provider credentials, and raw provider exceptions are never logged by this service.

Background tasks are in-process, not a durable queue: a restart or provider failure can lose a delivery. Users can resend after the rate window; verify sender/provider health when deliveries fail. Do not enable HTTP request-body logging on auth endpoints. For high-volume operation, add a durable delivery worker and a retention job for expired challenges and old rate-limit rows; do not delete active reset grants or current rate-limit windows.

## Environment variables

Set these on the **backend service only** (or in `backend/.env`). They are documented in root `.env.example`, `backend/.env.example`, and `backend/.env.production.example`. There are no new frontend environment variables.

| Variable           | Configuration                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_CODE_SECRET` | Independent random secret, at least 32 characters; identical on all replicas and stable across restarts. Rotating it invalidates pending codes/grants. |
| `EMAIL_FROM`       | Provider-authorized sender, e.g. `Mihna <no-reply@your-domain>`                                                                                        |
| `BREVO_API_KEY`    | Brevo transactional email API key; backend secret only                                                                                                 |

Generate `AUTH_CODE_SECRET` locally with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and store the result securely. Keep existing database, JWT, Google, and Vite settings unchanged.

For local delivery testing, use a Brevo test sender/domain and a non-production recipient. There is no API/debug endpoint that exposes verification codes.

## Migration and Railway deployment

Migration **`c72a9b830f14_account_management.py`**, after **`9a41c2d7e610`**, adds `users.email_verified`, the unique `uq_users_email_lower` index, `auth_codes`, and `auth_rate_limits`.

Existing users are backfilled to `email_verified=false`, including Google-linked users, because historical verification is not inferred. Their passwords, emails, Google subjects, roles, and login access remain intact. A subsequent Google login with the matching verified mailbox or an email-code confirmation marks the email verified. Verification does not lock anyone out.

The migration locks users against concurrent writes while checking and indexing. If case-insensitive duplicates exist, it aborts transactionally with an actionable error and leaves accounts/schema unchanged. It never merges accounts or invents replacement emails. Resolve affected ownership deliberately before retrying the migration. Plan the index build during a suitable deployment window for larger user tables. Downgrade removes verification/challenge metadata and the new index, but retains users, passwords, emails, and Google links; it invalidates all pending codes.

1. Configure Brevo, verify the sender/domain, add the required DNS records, and set `BREVO_API_KEY` as a backend secret.
2. Set the three backend email/verification variables above on Railway. Preserve all current JWT, Google, database, CORS, and Vite settings.
3. Check the backend's Alembic revision and take your normal database backup. Set the backend **Pre-deploy Command** to `python -m alembic upgrade head`. Never stamp an unknown schema as current or manually alter production tables.
4. Deploy the backend with the migration first, then rebuild/deploy the frontend. The existing `create_all()` startup call does not migrate existing user columns; the pre-deploy migration is required.
5. Test new registration, verification/resend, Google login, adding/changing passwords, changing email, and recovery on production with controlled test accounts for both roles. Confirm ordinary jobs, saved jobs, company pages, and exports still work. Real provider delivery and production browser interaction require this smoke check.

## Local commands (PowerShell)

From the repository root, configure `backend/.env` for your local PostgreSQL and Brevo sender, then:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

In a second terminal from the repository root:

```powershell
Set-Location frontend
npm ci
npm run build
npm run dev -- --port 5173
```

For the optional PostgreSQL regression suite, create a **dedicated local** database named `mihna_account_test`; never use the development/production database. The tests require localhost/127.0.0.1 and that exact database name. They create/remove only randomly named test schemas:

```powershell
# From backend; replace test credentials/port with your isolated PostgreSQL instance.
$env:MIHNA_TEST_DATABASE_URL = 'postgresql://test_user:test_password@127.0.0.1:5432/mihna_account_test'
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
Remove-Item Env:MIHNA_TEST_DATABASE_URL
```

## Validation

Run the commands above for current results. Tests mock Google exchange and Brevo delivery; the optional PostgreSQL suite checks migrations and concurrent code consumption in isolated schemas. Real inbox delivery and Google account selection require configured providers and controlled test accounts.
