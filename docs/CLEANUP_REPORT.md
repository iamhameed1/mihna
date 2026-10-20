# Repository cleanup inventory

Prepared before source edits on 2026-09-16. Existing uncommitted changes are preserved; the obsolete production Compose and Nginx files were already deleted before this task.

| Classification | Items and evidence |
| --- | --- |
| KEEP | All registered FastAPI routers and React pages, authentication/account security, job content regression tests, six historical migrations, PostgreSQL volume, canonical four-service Compose deployment, both Nginx configurations (proxy versus SPA server), Docker source builds and IPv4 health checks. |
| KEEP | npm dependencies: `cn` is imported by UI primitives; `shadcn/tailwind.css` is imported by CSS; `lib/utils.js` is referenced by the component generator. Python pins include required transitive dependencies and will be retained unless dependency metadata proves otherwise. |
| REMOVE | Unreferenced starter `react.svg`, `vite.svg`, `hero.png`; unreferenced standalone Skeleton and Separator primitives, subject to final reference verification. Unused `SavedJobResponse` schema, obsolete SMTP settings and tests, committed Alembic URL override. |
| MERGE | Four identical API filter parameter builders; analytics summary and CSV aggregation queries. |
| REFACTOR | Email error logging to exclude provider payloads; Brevo transport tests; stale Google login and email documentation; generated-artifact ignore rules. |
| UNCERTAIN | Historical environment variants, unused exports inside generated UI primitives, dynamic translation keys, theme tokens, old local virtual environments and database backup. Keep until purpose and references are verified. |

Baseline: frontend 69 passed; ESLint 0 errors / 2 existing hook warnings. Backend 68 discovered: 42 passed, 1 failed, 2 errors, 23 skipped. Two errors are obsolete SMTP mocks; failure is secret-bearing exception logging. Docker: backend/frontend/PostgreSQL healthy, Nginx running. Live database: 13 users, 40 jobs.

Validation and the final change manifest will be recorded below.

Final reference verification: KEEP `SavedJobResponse` (registered save-job response), all Python imports (Alembic imports models for metadata registration), and generated UI utility/configuration. No exact-content duplicate project files found. The Alembic configuration contained a hard-coded connection credential; remove it without reproducing it here. SMTP examples are stale because the runtime exclusively uses Brevo. Google documentation is stale because runtime uses authorization-code exchange with a backend client secret.

Additional verified removal: the module-level `models.__table_args__` tuple is never referenced and is not attached to any SQLAlchemy model. The historical timestamp migration explicitly removed that named constraint. Remove only the inert tuple; do not add a constraint or change the database. Remotive's existing application-level duplicate checks remain. Remove generated Python caches, including the abandoned translation-service bytecode, after validation.

## Summary

Conservative cleanup completed without redesigning pages, removing routes, changing schema, or modifying real environment files. Existing user edits were preserved. Changes remove unused assets/components, inert model configuration, duplicated query construction, obsolete SMTP tests/configuration, and inaccurate setup instructions. Email failure logs now omit exception contents and provider response bodies.

## Files deleted by this cleanup

| File | Reason |
| --- | --- |
| `frontend/src/assets/react.svg` | Unreferenced starter logo. |
| `frontend/src/assets/vite.svg` | Unreferenced starter logo. |
| `frontend/src/assets/hero.png` | Unreferenced image; no source, CSS, HTML, configuration, test, or documentation consumer. |
| `frontend/src/components/ui/separator.jsx` | No import or dynamic consumer; other primitives use their own separators. |
| `frontend/src/components/ui/skeleton.jsx` | No import or dynamic consumer. |

Removed generated `__pycache__` directories under backend, routers, tests, alembic, alembic/versions, and services, including `translation_service.cpython-314.pyc` and its obsolete package bytecode. Removed the now-empty services directory and root/backend Ruff caches. No database backup, active virtual environment, or installed frontend dependencies were deleted. Build output remains ignored for local preview.

`docker-compose.prod.yml` and `nginx/default.prod.conf` were already deleted before this task; this cleanup did not delete them again or restore them.

## Modified and added files

- `frontend/src/services/api.js`: reuse `jobFilterParams` for listings, analytics, and both exports; preserve existing query order, defaults, pagination, and error behavior.
- `frontend/src/services/api.test.js` (added): URL/filter/default regression coverage.
- `backend/routers/analytics.py`: CSV reuses the existing summary aggregation; CSV headers, sections, ordering, and filenames remain unchanged.
- `backend/models.py`: remove inert module-level `__table_args__`; no model-attached constraint changed.
- `backend/email_service.py`: preserve operational failure logging without sensitive exception text or provider response bodies.
- `backend/tests/test_email_service.py`: replace SMTP transport tests with Brevo request and redaction tests; preserve the existing secret-leak regression.
- `backend/tests/test_original_job_content.py`: add filtered/empty analytics and CSV section coverage.
- `backend/alembic.ini`: remove hard-coded connection credentials; existing `env.py` obtains the URL from application configuration.
- `backend/alembic/env.py`: remove abandoned template comments and explain the required metadata-registration import.
- `.env.example`, `backend/.env.example`, `backend/.env.production.example`, `backend/.env.docker.example`: reflect current backend Google code exchange and Brevo delivery.
- `.gitignore`, `backend/.dockerignore`: ignore local environments, caches, coverage, logs, and secret environment variants; exclude `.venv-*` from Docker context.
- `README.md`, `GOOGLE_LOGIN.md`, `ACCOUNT_MANAGEMENT.md`, `ARABIC_SUPPORT.md`: current setup/transport/test instructions and migration caveats; remove stale historical validation reports.
- `CLEANUP_REPORT.md` (added): inventory, evidence, results, and deliberately retained items.

## Dead code and duplication

Removed the unused Skeleton and Separator components and the inert model constraint tuple. No public route, registered schema, authentication handler, or working page was deleted. Consolidated four API filter builders into one and removed the duplicate analytics aggregation block from CSV export. Kept small similar UI blocks where spacing or semantics differ, and kept response wrappers whose error behavior differs.

## Dependencies

No Python or npm dependency was removed. Runtime imports, CSS imports, generator configuration, and transitive requirements justify retaining the current manifests. In particular, `shadcn` supplies imported CSS, `cn` is used by primitives and the generator utility, and requests/BeautifulSoup are needed for Google/Brevo/Remotive and HTML cleaning. Installed Ruff only into the existing local virtual environment for analysis; no new project toolchain dependency was added.

## Docker and environment

The canonical stack remains nginx/frontend/backend/postgres with the requested container names and existing named PostgreSQL volume. Both Nginx configurations have distinct active roles. The frontend builds source inside Docker and copies the resulting dist into Nginx. Its health check still uses `http://127.0.0.1`.

Removed obsolete `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY`, `SMTP_USERNAME`, and `SMTP_PASSWORD` from examples. Removed redundant `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` from the backend Docker example; these belong to the root Compose environment, while the backend uses `DATABASE_URL`. Added missing `GOOGLE_CLIENT_SECRET` and `BREVO_API_KEY` placeholders. Real `.env` files were not edited. Production environment examples remain documented credential templates.

## Tests and validation

| Check | Before | After |
| --- | --- | --- |
| Frontend tests | 69 passed, 0 failed | 71 passed, 0 failed; 3 files |
| Backend tests | 42 passed, 1 failed, 2 errors, 23 skipped; 68 total | 46 passed, 0 failed, 0 errors, 23 skipped; 69 total |
| ESLint | 0 errors, 2 hook warnings | 0 errors, same 2 warnings |
| Python static analysis | Required metadata import plus two historical-migration unused imports flagged | Runtime/tests/Alembic environment pass Ruff F checks; historical revisions excluded and unchanged |
| Frontend install | Existing dependencies | `npm ci --no-audit --no-fund` succeeded, 540 packages installed |
| Frontend production build | Not separately rerun before edits | Local and Docker builds passed; existing >500 kB bundle warning remains |
| Backend dependencies | Container `pip check` passed | Container `pip check` passed; requirements installation layer reused by Docker |
| Compose | Existing healthy stack | `config --quiet`, `build`, `up -d --wait`, and status checks passed |
| Nginx | Existing configuration | Both container `nginx -t` checks passed |
| Git whitespace | Existing mixed line endings | `git diff --check` passed |

Backend tests run from `backend` using `.venv/Scripts/python.exe -m unittest discover -s tests -q`. An intermediate invocation from the repository root failed module discovery; rerunning from the documented backend directory resolved it. Passlib still emits its existing bcrypt-version diagnostic, but password tests pass. Optional PostgreSQL tests were skipped because no dedicated test database URL was configured; live application data was not used for mutation tests.

## API and deep links

HTTP 200: `/`, `/api/docs`, `/api/jobs`, job details (`/api/jobs/68`), search, Remote/source filters, pagination/oldest sorting, jobs CSV, analytics summary, analytics CSV, and SPA routes `/job/68`, `/login`, `/register`, `/dashboard`, `/account`, `/saved`, `/company-jobs`, `/analytics`.

Unauthenticated `/api/me`, `/api/saved-jobs`, `/api/company/jobs`, and `/api/company/ingestion-logs` returned 401. Invalid register/login bodies returned 422. Successful registration/login, account mutations, authorization, Google verification, job mutations, saved jobs, and mocked Remotive ingestion are exercised in isolated tests, not by adding records to the live database.

Browser runtime initialization succeeded but discovery returned no connected browsers. No visual/browser interaction was performed. Automated navigation/i18n tests and HTTP deep-link checks passed; these do not substitute for manual visual testing or real Google/inbox delivery.

## Final Docker and database status

| Container | Status |
| --- | --- |
| mihna-nginx | Running; configuration valid |
| mihna-frontend | Healthy |
| mihna-backend | Healthy |
| mihna-postgres | Healthy |

Live users: **13 before and after**. Live jobs: **40 before and after**. Alembic revision: **e4f1a8c2d9b7 unchanged**. All six migration source files are byte-identical to the task-start working tree. No migrations, drops, database resets, volume removals, or live auth/job mutations were performed. These checks establish unchanged counts/history; no full row-by-row database comparison was taken before cleanup.

## Final searches and remaining work

- No obsolete job-translation runtime references remain. Matches are limited to the historical migration and documentation explaining optional removal of old environment values.
- English has 489 translation entries and Arabic 493. The four extras are required Arabic plural forms (`zero`, `two`, `few`, `many`); all other key sets align. Dynamic messages and plural keys were retained. No CSS token was removed on static-search evidence alone.
- No exact-content duplicate authored files or temporary TODO/FIXME/debug statements were found. Operational error logging remains.
- Retained generated UI exports/configuration, production environment templates, local virtual environments, and `mihna_backup.dump` because removing them was not justified by runtime import search.
- Existing hook warnings, bundle size, bcrypt diagnostic, optional PostgreSQL validation, and manual browser/provider checks remain.
- The historical initial migration is empty. Fresh startup currently uses `create_all`; a complete migration bootstrap is separate work. Do not apply the historical chain to an empty database or stamp an unknown schema blindly.
- Remotive's application-level duplicate guard remains; the historical migration removed its database uniqueness constraint. Concurrency hardening would be a separate behavior/schema change.
- A hard-coded connection credential was removed from Alembic configuration. Git history was not rewritten; rotate it separately if it was ever a real credential.

## Git

Reviewed the cleanup delta against a task-start working-tree snapshot, plus `git status`, `git diff`, and whitespace validation. The final Git status includes extensive pre-existing user edits and untracked files; those were preserved. No secrets, database dumps, node_modules, dist, virtual environments, or logs were added to tracking. Nothing was staged, committed, or pushed.
