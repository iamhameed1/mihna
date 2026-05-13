# Mihna

Mihna is a job market intelligence platform.

It allows companies to add job postings, job seekers to browse and save jobs, and users to view simple market analytics based on job data.

## Features

### Guest / Visitor

- View all jobs
- Search jobs
- Filter jobs by work type
- View job details

### Job Seeker

- Register and login
- Save jobs permanently in PostgreSQL
- View saved jobs
- Remove saved jobs
- View job details

### Company

- Register and login
- Add jobs
- Edit only company-owned jobs
- Delete only company-owned jobs
- View company jobs
- Import remote jobs from Remotive API
- View ingestion logs
- View company dashboard analytics
- View market analytics

### Data Engineering Features

- External job ingestion from Remotive API
- HTML job description cleaning
- Duplicate checking in Python
- Database-level duplicate protection using unique constraint
- Ingestion logs table
- Pipeline stats:
  - Total runs
  - Successful runs
  - Failed runs
  - Jobs added
  - Duplicates skipped
- PostgreSQL storage
- Environment variables with `.env`

### Frontend Features

- Role-based sidebar navigation
- Login/Register pages
- Account page
- Job details page
- Dashboard charts
- Market analytics charts
- Dark/light theme toggle
- Loading and error states
- Form validation

## Tech Stack

### Frontend

- React
- Vite
- CSS
- Recharts

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT authentication
- Passlib password hashing
- python-dotenv
- Requests
- BeautifulSoup

### Database

- PostgreSQL

## Database

The project uses PostgreSQL.

### Main Tables

#### users

Stores registered users.

Fields:

- id
- name
- email
- password_hash
- role

Roles:

- job_seeker
- company

#### jobs

Stores company-created and imported jobs.

Fields:

- id
- title
- company
- country
- city
- type
- salary
- link
- description
- owner_id
- source
- external_id

#### saved_jobs

Stores saved jobs for job seekers.

Fields:

- id
- user_id
- job_id

#### ingestion_logs

Stores external import pipeline logs.

Fields:

- id
- source
- added_count
- skipped_count
- status
- error_message
- started_at
- finished_at

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT token |
| GET | `/me` | Get current logged-in user |

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/jobs` | Get all jobs |
| POST | `/jobs` | Create a job, company only |
| PUT | `/jobs/{job_id}` | Update own job, company only |
| DELETE | `/jobs/{job_id}` | Delete own job, company only |

### Saved Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/saved-jobs` | Get saved jobs, job seeker only |
| POST | `/saved-jobs/{job_id}` | Save a job, job seeker only |
| DELETE | `/saved-jobs/{job_id}` | Remove saved job, job seeker only |

### Company / Data Pipeline

| Method | Endpoint | Description |
|---|---|---|
| GET | `/company/jobs` | Get company-owned jobs |
| POST | `/company/fetch-remotive-jobs` | Import jobs from Remotive API |
| GET | `/company/ingestion-logs` | View import pipeline logs |

## Project Structure

```text
Mihna/
  backend/
    main.py
    database.py
    models.py
    schemas.py
    requirements.txt

  frontend/
    src/
      components/
        Header.jsx
        Sidebar.jsx
        JobCard.jsx
      pages/
        HomePage.jsx
        AddJobPage.jsx
        SavedJobsPage.jsx
        DashboardPage.jsx
        MarketAnalyticsPage.jsx
      services/
        api.js
      App.jsx
      App.css

  .gitignore
  README.md

  ## Purpose

This project was built to practice full-stack development and data engineering fundamentals:

- REST API design
- Authentication and authorization
- JWT login system
- Role-based access control
- CRUD operations
- PostgreSQL database design
- Many-to-many style saved jobs feature
- External API ingestion
- Data cleaning and transformation
- Deduplication
- Pipeline logging and observability
- Frontend API integration
- Charts and analytics
- Git and GitHub workflow