# Mihna

Mihna is a job market intelligence platform.

It allows companies to add job postings, job seekers to browse and save jobs, and users to view simple market analytics based on job data.

## Features

- Add new jobs
- Edit existing jobs
- Delete jobs
- View latest jobs
- Search jobs by title, company, city, country, type, or description
- Filter jobs by work type:
  - Onsite
  - Hybrid
  - Remote
- Save jobs on the frontend
- Dashboard analytics
- Market analytics
- PostgreSQL database integration
- FastAPI backend
- React frontend

## Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- python-dotenv

### Database

- PostgreSQL

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