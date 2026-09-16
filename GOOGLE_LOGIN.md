# Google login setup

Mihna uses the Google Identity Services authorization-code popup. `GoogleSignInButton` calls `google.accounts.oauth2.initCodeClient` with `openid email profile`; Login sends `{code, redirect_uri: window.location.origin, password?}` to `POST /auth/google`. The backend exchanges the code using its client ID and client secret, then verifies the returned ID token with `google-auth`. Google tokens are not persisted; successful login issues the normal Mihna JWT.

## Configuration

Use a Google Web application OAuth client. Register each browser origin you actually use, including `http://localhost` for Compose and `http://localhost:5173` for Vite. The current implementation uses a popup callback, not a backend redirect route. Keep the browser origin consistent with the `redirect_uri` sent for code exchange and the OAuth client configuration.

| Location | Variable | Purpose |
| --- | --- | --- |
| Backend environment | `GOOGLE_CLIENT_ID` | Web application client ID |
| Backend environment | `GOOGLE_CLIENT_SECRET` | Secret used for server-side code exchange; never expose through Vite |
| Frontend build environment | `VITE_GOOGLE_CLIENT_ID` | Same client ID |
| Frontend build environment | `VITE_API_URL` | `/api` for Compose and proxied local development |

For Compose, set frontend build values in root `.env`, backend values in `backend/.env.docker`, then run `docker compose up --build`. For direct development use `frontend/.env.local` and `backend/.env`. Rebuild the frontend after changing build values. Existing Railway deployments can keep their configured public API URL and origins; preserve matching backend CORS configuration.

## Identity and account behavior

New users receive Google's name/email and the `job_seeker` role. Existing users retain their role and password. Google-only users have a NULL password hash; local password login rejects them until they add or recover a password.

Gmail/Workspace identities can link by case-insensitive email. First-time linking for an email Google does not host requires the existing Mihna password. Conflicting identities are rejected. Returning users resolve through their stable Google subject; a changed Google email does not overwrite their Mihna email. Email verification is updated only when the verified Google address matches the account mailbox.

## Database and verification

Preserve all historical migrations. Existing databases need an accurate revision history before `python -m alembic upgrade head`; startup `create_all()` does not migrate existing tables. Never blindly stamp an unknown database. See README for fresh-database startup and ACCOUNT_MANAGEMENT.md for account migrations.

From `backend`, install `requirements-dev.txt` and run `python -m unittest discover -s tests -v`. Tests use isolated databases and mocked Google exchange/certificates. From `frontend`, run `npm test`, `npm run lint`, and `npm run build`.

Real Google verification still requires configured credentials and an interactive account: check a new user, an existing company, non-Google-email linking, popup cancellation, blocked script loading, logout/relogin, and mobile/light/dark layouts. No live Google sign-in is implied by passing mocked tests.
