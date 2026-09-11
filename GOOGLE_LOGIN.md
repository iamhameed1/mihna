# Google login setup

Mihna uses Google Identity Services in popup mode. The JavaScript callback sends an ID token as JSON to `POST /auth/google`; the backend verifies Google's signature, issuer, audience, expiry, subject and verified email using `google-auth`. Both login methods issue the existing Mihna JWT and use the same `completeLogin` function and `mihna_token` storage. Google access/refresh tokens and client secrets are not used. ID tokens are not persisted.

The Google button explicitly sets `use_fedcm_for_prompt: false` and `use_fedcm_for_button: false` in `google.accounts.id.initialize`, retaining `ux_mode: "popup"`. Google now deprecates/ignores the prompt flag; the button flag selects the standard popup instead of FedCM. The implementation uses `renderButton` and does not call the One Tap `prompt()` method. See the [Google JavaScript API reference](https://developers.google.com/identity/gsi/web/reference/js-reference).

New users receive Google's name/email and `job_seeker`; existing users retain their name, password and role, including existing companies. Google's stable subject is stored in `users.google_sub`. Google-only users have a NULL password hash, which password login rejects normally.

Existing Gmail/Workspace accounts link automatically by case-insensitive email. For an existing third-party email that Google does not host, enter the existing Mihna password in the login form and click Continue with Google to link once. This follows [Google's account-linking guidance](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token). Ambiguous case-variant emails or an email already linked to another Google subject are rejected rather than merged. Subsequent sign-ins use the stored subject; changes to Google's email do not rewrite the Mihna email.

## Google Cloud Console

1. Create/select a project, then open Google Auth Platform. Configure Branding (Mihna, support/contact email, production home page and any required privacy/terms links).
2. Configure Audience as External. While in Testing, add the Google accounts you will test with. Publish to Production when ready for public sign-in.
3. Create a client with application type **Web application**.
4. Add these **Authorized JavaScript origins**, without trailing slashes or paths:
   - `http://localhost:5173`
   - `https://www.mihna.xyz`
   - `https://mihnafronend-production.up.railway.app`
5. **Authorized redirect URIs: leave empty.** This implementation uses a JavaScript popup callback, not a redirect route. No local or Railway OAuth redirect callback URL exists or is required. Only basic identity (`openid`, email, profile) is used; do not enable Google API access or offline tokens.
6. Copy the client ID into both environment variables below. See [Google's button documentation](https://developers.google.com/identity/gsi/web/guides/display-button).

The Railway domains above come from this repository's existing README and CORS configuration. If your public domains have changed, update the authorized origin, backend CORS and frontend API URL accordingly.

## Environment variables

| Location | Variable | Value |
| --- | --- | --- |
| `backend/.env` / Railway backend service | `GOOGLE_CLIENT_ID` | Your Web client ID ending in `.apps.googleusercontent.com` |
| `frontend/.env.local` / Railway frontend service | `VITE_GOOGLE_CLIENT_ID` | The same client ID |
| `frontend/.env.local` | `VITE_API_URL` | `/api` (existing default) |
| Railway frontend service | `VITE_API_URL` | `https://mihna-production.up.railway.app` (existing setting) |

Keep the existing DATABASE_URL, SECRET_KEY, ALGORITHM and ACCESS_TOKEN_EXPIRE_MINUTES. Vite reads frontend environment files, not the root `.env`; `.env.example` explains which values go where. Frontend variables are build-time settings, so rebuild/redeploy after changing them. The frontend Dockerfile accepts the new client ID as a build argument too. If using Docker Compose, pass `VITE_GOOGLE_CLIENT_ID` in the frontend build args.

## Exact endpoints

| Purpose | Local | Railway |
| --- | --- | --- |
| Google redirect callback | None (popup JavaScript callback) | None (popup JavaScript callback) |
| Browser ID-token POST | `http://localhost:5173/api/auth/google` | `https://mihna-production.up.railway.app/auth/google` |
| Direct backend ID-token POST | `http://127.0.0.1:8000/auth/google` | `https://mihna-production.up.railway.app/auth/google` |

Do not register the POST endpoints as Google redirect URIs. Vite strips `/api` locally; Railway's existing API URL accesses the backend directly.

## Local commands (PowerShell)

From the project root, after adding the environment variables:

```powershell
Set-Location backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic current
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m unittest discover -s tests -v
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

In a second terminal from the project root:

```powershell
Set-Location frontend
npm ci
npm run dev -- --port 5173
```

Open `http://localhost:5173`, navigate to Login, and click Continue with Google. To verify the frontend production build: `npm run build` from `frontend`.

After deploying the frontend change, repeat the button check on `https://www.mihna.xyz`: the standard Google account chooser popup should open, then the JavaScript callback should send the ID token to `POST /auth/google` and complete the existing Mihna login. Ensure `https://www.mihna.xyz` is registered as an Authorized JavaScript origin on the client used by `VITE_GOOGLE_CLIENT_ID`; leave Authorized redirect URIs empty. Repeat on localhost to verify local support.

## Railway deployment

Set the variables on the corresponding services. On the backend service (service root `backend`), configure this **Pre-deploy Command** so the migration runs against Railway's private DATABASE_URL before new code starts:

```sh
python -m alembic upgrade head
```

Keep the existing backend start command. Deploy the backend migration/code first, then rebuild/redeploy the frontend. Railway installs the updated `requirements.txt` during its backend build. For a manual frontend Docker build from the repository root:

```powershell
docker build --build-arg VITE_API_URL=https://mihna-production.up.railway.app --build-arg VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com -t mihna-frontend ./frontend
```

The migration follows `808bca403933`. Existing databases must have accurate Alembic revision history; `create_all` does not migrate existing tables. Do not blindly stamp an untracked production database: inspect its schema/history first. Downgrade refuses to remove Google support while passwordless users exist.

## Verification

Automated tests use an isolated SQLite database and locally signed RSA tokens with a mocked Google certificate response. They cover new/repeat users, company role preservation, password login, external-email linking, conflicting identities, stable subjects and invalid identity claims. They do not contact Google or modify the local/production PostgreSQL database.

Before rollout, test real Google sign-in with an existing user, an existing company, and a new email; confirm the new account is a job seeker, logout/relogin works, and both themes/mobile layouts display the Google button. Also test popup cancellation and blocked Google script loading. A real client ID and Google account interaction are required for those checks.

Checks completed: 11 backend tests passed; frontend production build passed; targeted lint for GoogleSignInButton, LoginPage and api.js passed; PostgreSQL migration SQL generated successfully offline. App.jsx lint reports the same existing navigation-effect error and hook warnings as HEAD. Passlib emits its existing bcrypt-version warning, but password verification tests pass. No live PostgreSQL migration or real Google browser sign-in was performed.

## Changed files

- Backend: `backend/auth.py`, `backend/google_auth.py`, `backend/models.py`, `backend/schemas.py`, `backend/routers/auth.py`, `backend/requirements.txt` (also converted from UTF-16 to UTF-8).
- Migration: `backend/alembic/env.py` (now uses the app's DATABASE_URL), `backend/alembic/versions/9a41c2d7e610_google_login.py`.
- Frontend: `frontend/src/App.jsx`, `frontend/src/pages/LoginPage.jsx`, `frontend/src/components/GoogleSignInButton.jsx`, `frontend/src/services/api.js`, `frontend/Dockerfile`.
- Configuration/docs/tests: `.env.example`, `backend/.env.example`, `backend/.env.production.example`, `.gitignore`, `backend/tests/test_google_login.py`, `GOOGLE_LOGIN.md`.
