# Mihna

Mihna is a full-stack job market intelligence platform for managing, exploring, and analyzing technology job postings.

The project was built as a personal project to practice **full-stack development, backend engineering, data engineering, API integration, database design, and Docker-based deployment**.

## Features

### Guest / Visitor

* View available jobs
* Search jobs
* Filter jobs by:

  * Work type
  * Location
  * Source
  * Date range
* Sort jobs
* Paginate job results
* View job details
* Export filtered jobs to CSV

### Job Seeker

* Register and login
* JWT-based authentication
* View account information
* Save jobs permanently in PostgreSQL
* View saved jobs
* Remove saved jobs

### Company

* Register and login
* JWT-based authentication
* Create job postings
* Edit company-owned jobs
* Delete company-owned jobs
* View company-owned jobs
* Import remote jobs from the Remotive API
* View ingestion logs
* View company analytics
* View market analytics

### Data Engineering

* External job ingestion from Remotive API
* HTML job description cleaning
* Python-based duplicate detection
* Database-level duplicate protection
* PostgreSQL data storage
* Ingestion pipeline logging
* Pipeline statistics:

  * Total runs
  * Successful runs
  * Failed runs
  * Jobs added
  * Duplicates skipped
* Filtering and aggregation for market analytics
* CSV data exports

### Analytics

The analytics system provides:

* Total jobs
* Total companies
* Manual jobs
* Remotive jobs
* Platform jobs
* Remote jobs
* Hybrid jobs
* Onsite jobs
* Jobs by source
* Jobs by work type
* Jobs by date
* Top cities
* Top companies

Analytics can be filtered using the same job filters and exported as CSV.

### Frontend

* React + Vite
* Role-based navigation
* Login/Register pages
* Account page
* Job listings
* Job details
* Saved jobs
* Company dashboard
* Market analytics dashboard
* Charts using Recharts
* Dark/light theme
* Loading states
* Error states
* Form validation
* Pagination
* Job filtering and sorting
* CSV export

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Recharts

### Backend

* Python
* FastAPI
* SQLAlchemy
* JWT authentication
* Passlib password hashing
* python-dotenv
* Requests
* BeautifulSoup

### Database

* PostgreSQL 18

### Infrastructure

* Docker
* Docker Compose
* Nginx
* Uvicorn

## Architecture

Mihna uses a containerized architecture:

```text
                    Browser
                       |
                       v
                +-------------+
                |    Nginx    |
                | Reverse     |
                | Proxy        |
                +-------------+
                  /         \
                 /           \
                v             v
        +-----------+   +-----------+
        | Frontend  |   |  Backend  |
        | React     |   | FastAPI   |
        +-----------+   +-----------+
                             |
                             v
                       +-----------+
                       | PostgreSQL|
                       +-----------+
```

Nginx acts as the public entry point.

Frontend requests use:

```text
/api/*
```

and Nginx forwards them to the FastAPI backend.

## Docker Services

The Docker Compose configuration contains four services:

| Service    | Technology        | Purpose              |
| ---------- | ----------------- | -------------------- |
| `postgres` | PostgreSQL 18     | Database             |
| `backend`  | FastAPI + Uvicorn | REST API             |
| `frontend` | React + Nginx     | Frontend application |
| `nginx`    | Nginx             | Reverse proxy        |

### Ports

| Service    |   Port |
| ---------- | -----: |
| Nginx      |   `80` |
| Backend    | `8000` |
| Frontend   | `5173` |
| PostgreSQL | `5432` |

The recommended application entry point is:

```text
http://localhost
```

The backend can also be accessed directly during development:

```text
http://localhost:8000
```

The frontend can be accessed directly at:

```text
http://localhost:5173
```

## API

The application API is exposed through the Nginx `/api` path.

### Authentication

| Method | Endpoint        | Description            |
| ------ | --------------- | ---------------------- |
| POST   | `/api/register` | Register a user        |
| POST   | `/api/login`    | Login and receive JWT  |
| GET    | `/api/me`       | Get authenticated user |

### Jobs

| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| GET    | `/api/jobs`            | Get paginated jobs  |
| POST   | `/api/jobs`            | Create a job        |
| PUT    | `/api/jobs/{job_id}`   | Update an owned job |
| DELETE | `/api/jobs/{job_id}`   | Delete an owned job |
| GET    | `/api/jobs/export/csv` | Export jobs to CSV  |

### Saved Jobs

| Method | Endpoint                   | Description        |
| ------ | -------------------------- | ------------------ |
| GET    | `/api/saved-jobs`          | Get saved jobs     |
| POST   | `/api/saved-jobs/{job_id}` | Save a job         |
| DELETE | `/api/saved-jobs/{job_id}` | Remove a saved job |

### Company

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| GET    | `/api/company/jobs`                | Get company-owned jobs    |
| POST   | `/api/company/fetch-remotive-jobs` | Import jobs from Remotive |
| GET    | `/api/company/ingestion-logs`      | Get ingestion logs        |

### Analytics

| Method | Endpoint                    | Description             |
| ------ | --------------------------- | ----------------------- |
| GET    | `/api/analytics/summary`    | Get market analytics    |
| GET    | `/api/analytics/export/csv` | Export analytics to CSV |

## Database

Mihna uses PostgreSQL.

### Main Tables

#### users

Stores registered users.

Fields include:

* `id`
* `name`
* `email`
* `password_hash`
* `role`

Supported roles:

* `job_seeker`
* `company`

#### jobs

Stores manually created and externally imported jobs.

Fields include:

* `id`
* `title`
* `company`
* `country`
* `city`
* `type`
* `salary`
* `description`
* `link`
* `owner_id`
* `source`
* `external_id`
* `created_at`

#### saved_jobs

Stores jobs saved by job seekers.

Fields:

* `id`
* `user_id`
* `job_id`

#### ingestion_logs

Stores external job ingestion pipeline results.

Fields include:

* `id`
* `source`
* `added_count`
* `skipped_count`
* `status`
* `error_message`
* `started_at`
* `finished_at`

## Project Structure

```text
Mihna/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── dependencies.py
│   ├── utils.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.docker.example
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   └── routers/
│       ├── auth.py
│       ├── jobs.py
│       ├── saved_jobs.py
│       ├── company.py
│       └── analytics.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       │   └── api.js
│       ├── App.jsx
│       └── App.css
│
├── nginx/
│   └── default.conf
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Environment Variables

Sensitive environment files are intentionally excluded from Git.

### Root `.env`

Used by Docker Compose for PostgreSQL configuration.

Example:

```env
POSTGRES_DB=mihna_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-this-password
```

### Backend `.env.docker`

Used by the FastAPI container.

Example:

```env
DATABASE_URL=postgresql://postgres:change-this-password@postgres:5432/mihna_db
SECRET_KEY=change-this-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Do not commit real passwords, secret keys, or other credentials to Git.

## Running with Docker

### 1. Clone the repository

```bash
git clone https://github.com/iamhameed1/mihna.git
cd mihna
```

### 2. Create the environment files

Create:

```text
.env
```

and:

```text
backend/.env.docker
```

using the provided example files as templates.

### 3. Start the application

```bash
docker compose up -d --build
```

### 4. Check the containers

```bash
docker compose ps
```

All required services should be running.

### 5. Open Mihna

```text
http://localhost
```

## Useful Docker Commands

Start:

```bash
docker compose up -d
```

Rebuild:

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

View logs:

```bash
docker compose logs
```

View a specific service:

```bash
docker compose logs backend
```

Check configuration:

```bash
docker compose config --quiet
```

## Health Checks

The Docker services include health checks for the backend, frontend, and PostgreSQL database.

The application was tested through the Nginx reverse proxy with successful HTTP responses for:

```text
/api/jobs
/api/analytics/summary
/openapi.json
```

Authentication was also tested through the `/api` route:

```text
POST /api/login
GET  /api/me
```

with successful JWT authentication.

## Git Workflow

The project uses Git and GitHub for source control.

Repository:

https://github.com/iamhameed1/mihna

Example workflow:

```bash
git status
git add .
git commit -m "Describe changes"
git push origin main
```

Generated Python files such as `__pycache__` and `.pyc` files are excluded from version control.

Environment files containing secrets are also excluded.

## Purpose

Mihna is a personal project built to practice and demonstrate:

* Full-stack application development
* REST API design
* Authentication and authorization
* JWT authentication
* Role-based access control
* CRUD operations
* PostgreSQL database design
* SQLAlchemy
* External API integration
* Data ingestion
* Data cleaning and transformation
* Deduplication
* Pipeline logging
* Analytics and aggregation
* CSV data exports
* React frontend development
* Docker containerization
* Nginx reverse proxy configuration
* Git and GitHub workflow

## Project Status

The core Mihna application is functional and containerized.

Current infrastructure includes:

* React frontend
* FastAPI backend
* PostgreSQL 18
* Docker Compose
* Nginx reverse proxy
* JWT authentication
* External job ingestion
* Analytics
* CSV exports
* Environment-based configuration

The application has been tested locally through the Nginx entry point and the main API and authentication flows are working successfully.
