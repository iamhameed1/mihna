# Mihna

Mihna (مهنة) is a full-stack job market intelligence platform for technology jobs. It combines job discovery, company-managed postings, saved jobs, Remotive ingestion, analytics, and CSV exports in one portfolio project.

> Project status: feature-complete and in maintenance mode. The repository is kept as a documented demonstration project rather than an actively developed production service.

## What the project demonstrates

- Full-stack development with React, FastAPI, and PostgreSQL
- JWT authentication and role-based authorization
- Google OAuth login
- Email verification, password recovery, and account management
- External API ingestion with duplicate protection and run logs
- Server-side filtering, sorting, pagination, analytics, and CSV export
- Database migrations with Alembic
- Local and production-style Docker Compose deployments
- Frontend and backend automated tests

## Roles and access

| Capability                            | Guest | Job seeker | Company |
| ------------------------------------- | :---: | :--------: | :-----: |
| Browse, search, filter, and view jobs |  Yes  |    Yes     |   Yes   |
| Export filtered jobs                  |  Yes  |    Yes     |   Yes   |
| Save and remove saved jobs            |  No   |    Yes     |   No    |
| Manage own account                    |  No   |    Yes     |   Yes   |
| Create, edit, and delete owned jobs   |  No   |     No     |   Yes   |
| Import jobs from Remotive             |  No   |     No     |   Yes   |
| View dashboards and ingestion logs    |  No   |     No     |   Yes   |

Authorization is enforced by the backend. Frontend route guards improve navigation but are not the security boundary.

## Technology

| Layer          | Main tools                                                    |
| -------------- | ------------------------------------------------------------- |
| Frontend       | React 19, Vite, React Router, Tailwind CSS, Base UI, Recharts |
| Backend        | Python, FastAPI, SQLAlchemy, Pydantic                         |
| Authentication | JWT, bcrypt/passlib, Google OAuth                             |
| Email          | Brevo transactional email API                                 |
| Data           | PostgreSQL 18, Alembic, Remotive API                          |
| Infrastructure | Docker Compose, Nginx, Uvicorn                                |
| Testing        | Vitest, Testing Library, pytest                               |

## Architecture

```mermaid
flowchart TD
    B[Browser] --> N[Nginx]
    N --> F[React frontend]
    N --> A[FastAPI API]
    A --> P[(PostgreSQL)]
    A --> R[Remotive API]
    A --> E[Brevo API]
```

Browser API calls use the `/api` prefix. In Docker, the public Nginx service routes page requests to the frontend and API requests to FastAPI.

## Repository layout

```text
mihna/
├── backend/
│   ├── alembic/            # Database migrations
│   ├── routers/            # API route modules
│   ├── tests/              # Backend tests
│   ├── main.py             # FastAPI application
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Request/response schemas
│   └── requirements*.txt
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/api.js
│       └── navigation.test.jsx
├── nginx/
├── docker-compose.yml
├── docker-compose.prod.yml
├── ACCOUNT_MANAGEMENT.md
└── GOOGLE_LOGIN.md
```

## Frontend routes

| Route             | Page                          | Access          |
| ----------------- | ----------------------------- | --------------- |
| `/`               | Discover jobs                 | Everyone        |
| `/job/:id`        | Job details                   | Everyone        |
| `/saved`          | Saved jobs                    | Job seeker      |
| `/dashboard`      | Company dashboard             | Company         |
| `/analytics`      | Market analytics              | Company         |
| `/add-job`        | Add or edit job               | Company         |
| `/company-jobs`   | Company-owned jobs            | Company         |
| `/ingestion-logs` | Remotive ingestion history    | Company         |
| `/account`        | Account settings              | Signed-in users |
| `/login`          | Sign in and password recovery | Guests          |
| `/register`       | Registration and verification | Guests          |

Unknown routes redirect to `/`.

## API overview

FastAPI exposes interactive documentation at `/docs` during direct backend development and at `/api/docs` behind the Docker Nginx proxy.

### Authentication and account

- `POST /register`
- `POST /login`
- `POST /auth/google`
- `GET /me`
- `PATCH /users/me`
- `POST /users/me/password`
- `POST /users/me/change-email`
- `POST /users/me/verify-new-email`
- `POST /auth/send-verification-code`
- `POST /auth/resend-verification-code`
- `POST /auth/verify-email`
- `POST /auth/forgot-password`
- `POST /auth/verify-reset-code`
- `POST /auth/reset-password`

### Jobs and saved jobs

- `GET /jobs`
- `GET /jobs/{job_id}`
- `GET /jobs/export/csv`
- `POST /jobs`
- `PUT /jobs/{job_id}`
- `DELETE /jobs/{job_id}`
- `GET /saved-jobs`
- `POST /saved-jobs/{job_id}`
- `DELETE /saved-jobs/{job_id}`

### Company and analytics

- `GET /company/jobs`
- `POST /company/fetch-remotive-jobs`
- `GET /company/ingestion-logs`
- `GET /analytics/summary`
- `GET /analytics/export/csv`

The generated OpenAPI page is the authoritative request/response reference.

## Local development

### Prerequisites

- Python 3.12 or newer
- Node.js 20 or newer
- PostgreSQL 18
- Git

### 1. Clone and configure

```powershell
git clone https://github.com/iamhameed1/mihna.git
cd mihna
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mihna_db
SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
AUTH_CODE_SECRET=replace_with_a_different_random_secret_at_least_32_characters
EMAIL_FROM=Mihna <no-reply@your-verified-domain.example>
BREVO_API_KEY=replace_with_your_brevo_api_key
```

Google and Brevo values are needed only for their related login and email flows. See [GOOGLE_LOGIN.md](GOOGLE_LOGIN.md) and [ACCOUNT_MANAGEMENT.md](ACCOUNT_MANAGEMENT.md).

For direct Vite development, optionally create `frontend/.env.local`:

```dotenv
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### 2. Prepare the database and backend

Create a PostgreSQL database named `mihna_db`, then run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn main:app --reload
```

Backend: <http://127.0.0.1:8000>

OpenAPI docs: <http://127.0.0.1:8000/docs>

### 3. Start the frontend

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Frontend: <http://localhost:5173>

Vite proxies `/api` requests to `http://127.0.0.1:8000`.

## Docker development

Create the environment files:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.docker.example backend/.env.docker
```

Use identical PostgreSQL database, user, and password values in both files and in the backend `DATABASE_URL`. Then start the stack:

```powershell
docker compose up --build
```

Open <http://localhost>. The Compose stack contains PostgreSQL, the FastAPI backend, the built frontend, and the public Nginx reverse proxy.

Useful commands:

```powershell
docker compose ps
docker compose logs -f backend
docker compose exec backend alembic upgrade head
docker compose down
```

`docker compose down` preserves the named database volume. Adding `--volumes` deletes that data.

## Database

The principal tables are:

- `users`: local/Google identities, roles, and verification state
- `jobs`: manual and imported job records
- `saved_jobs`: job-seeker bookmarks
- `ingestion_logs`: Remotive pipeline runs and counts
- `account_challenges`: hashed verification/recovery challenges
- `auth_rate_limits`: account-flow rate-limit windows

Schema changes are managed with Alembic. Do not edit an applied migration; create a new revision.

## Ingestion and analytics

A company user can trigger the Remotive pipeline. The backend cleans HTML descriptions, maps remote records into the local schema, skips duplicates, and records added/skipped counts and status in `ingestion_logs`.

Analytics are calculated by the backend so dashboard totals and CSV exports use the same filter behavior as the jobs API.

## Quality checks

Frontend:

```powershell
cd frontend
npm ci
npm run lint
npm test
npm run build
npx prettier --check "**/*.{js,jsx,json,css,md}"
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m pytest
ruff format --check .
ruff check . --select I
```

PostgreSQL integration tests are skipped unless `MIHNA_TEST_DATABASE_URL` points to an isolated test database. Never point it at development or production data.

## Security notes

- Never commit `.env`, `.env.local`, `.env.docker`, tokens, or credentials.
- Use independent random values for `SECRET_KEY` and `AUTH_CODE_SECRET`.
- The backend stores verification codes as keyed digests, not plaintext.
- Email delivery failures are logged without raw provider errors, recipients, or codes.
- Imported and user-provided HTML is cleaned before use.
- Run behind HTTPS in production and restrict CORS to the deployed frontend origins.

## Deployment

`docker-compose.prod.yml` and the production environment examples provide a starting point. Before deployment:

1. Provision persistent PostgreSQL storage.
2. set all production secrets in the hosting platform rather than in Git;
3. run `alembic upgrade head`;
4. configure the Google redirect origins and Brevo sender/domain;
5. expose the public Nginx service through HTTPS;
6. verify `/api/docs`, login, email delivery, ingestion, and CSV downloads.

The repository contains deployment configuration, but no live-service availability is guaranteed.

## Additional documentation

- [Account management and email delivery](ACCOUNT_MANAGEMENT.md)
- [Google login setup](GOOGLE_LOGIN.md)
