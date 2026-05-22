from fastapi.responses import StreamingResponse
from routers import company as company_router
from routers import auth as auth_router
from routers import saved_jobs as saved_jobs_router
from routers import jobs as jobs_router
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from auth import hash_password
from utils import apply_job_filters
from sqlalchemy import func
from dependencies import get_db, require_company_user
import models
import schemas
from database import SessionLocal, engine
import csv
import io

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(saved_jobs_router.router)
app.include_router(auth_router.router)
app.include_router(saved_jobs_router.router)
app.include_router(jobs_router.router)
app.include_router(company_router.router)

@app.get("/")
def home():
    return {"message": "Mihna API is running with PostgreSQL"}



@app.get("/analytics/summary", response_model=schemas.AnalyticsSummaryResponse)
def get_analytics_summary(
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    location: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_range: str | None = Query(default=None),
    db: Session = Depends(get_db)
):

    query = db.query(models.Job)

    query = apply_job_filters(
    query=query,
    search=search,
    type=type,
    location=location,
    source=source,
    date_range=date_range,
    )

    total_jobs = query.count()

    total_companies = query.with_entities(
        func.count(func.distinct(models.Job.company))
    ).scalar()

    manual_jobs = query.filter(models.Job.source.is_(None)).count()
    remotive_jobs = query.filter(models.Job.source == "remotive").count()
    platform_jobs = query.filter(models.Job.source.is_not(None)).count()

    remote_jobs = query.filter(models.Job.type == "Remote").count()
    hybrid_jobs = query.filter(models.Job.type == "Hybrid").count()
    onsite_jobs = query.filter(models.Job.type == "Onsite").count()

    top_cities_query = (
        query.with_entities(models.Job.city, func.count(models.Job.id))
        .group_by(models.Job.city)
        .order_by(func.count(models.Job.id).desc())
        .limit(5)
        .all()
    )

    top_companies_query = (
        query.with_entities(models.Job.company, func.count(models.Job.id))
        .group_by(models.Job.company)
        .order_by(func.count(models.Job.id).desc())
        .limit(5)
        .all()
    )

    jobs_by_source_query = (
        query.with_entities(
            func.coalesce(models.Job.source, "manual"),
            func.count(models.Job.id)
        )
        .group_by(func.coalesce(models.Job.source, "manual"))
        .order_by(func.count(models.Job.id).desc())
        .all()
    )

    jobs_by_type_query = (
        query.with_entities(models.Job.type, func.count(models.Job.id))
        .group_by(models.Job.type)
        .order_by(func.count(models.Job.id).desc())
        .all()
    )

    jobs_by_date_query = (
        query.with_entities(
            func.date(models.Job.created_at),
            func.count(models.Job.id)
        )
        .filter(models.Job.created_at.is_not(None))
        .group_by(func.date(models.Job.created_at))
        .order_by(func.date(models.Job.created_at).asc())
        .all()
    )

    top_cities = [
        {"name": city, "count": count}
        for city, count in top_cities_query
    ]

    top_companies = [
        {"name": company, "count": count}
        for company, count in top_companies_query
    ]

    jobs_by_source = [
        {"name": source_name, "count": count}
        for source_name, count in jobs_by_source_query
    ]

    jobs_by_type = [
        {"name": job_type, "count": count}
        for job_type, count in jobs_by_type_query
    ]

    jobs_by_date = [
        {"date": str(job_date), "count": count}
        for job_date, count in jobs_by_date_query
    ]

    return {
        "total_jobs": total_jobs,
        "total_companies": total_companies,
        "manual_jobs": manual_jobs,
        "remotive_jobs": remotive_jobs,
        "platform_jobs": platform_jobs,
        "remote_jobs": remote_jobs,
        "hybrid_jobs": hybrid_jobs,
        "onsite_jobs": onsite_jobs,
        "top_cities": top_cities,
        "top_companies": top_companies,
        "jobs_by_source": jobs_by_source,
        "jobs_by_type": jobs_by_type,
        "jobs_by_date": jobs_by_date,
    }

@app.get("/analytics/export/csv")
def export_analytics_csv(
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    location: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_range: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Job)

    query = apply_job_filters(
    query=query,
    search=search,
    type=type,
    location=location,
    source=source,
    date_range=date_range,
    )

    total_jobs = query.count()

    total_companies = query.with_entities(
        func.count(func.distinct(models.Job.company))
    ).scalar()

    manual_jobs = query.filter(models.Job.source.is_(None)).count()
    remotive_jobs = query.filter(models.Job.source == "remotive").count()
    platform_jobs = query.filter(models.Job.source.is_not(None)).count()

    remote_jobs = query.filter(models.Job.type == "Remote").count()
    hybrid_jobs = query.filter(models.Job.type == "Hybrid").count()
    onsite_jobs = query.filter(models.Job.type == "Onsite").count()

    jobs_by_source = (
        query.with_entities(
            func.coalesce(models.Job.source, "manual"),
            func.count(models.Job.id)
        )
        .group_by(func.coalesce(models.Job.source, "manual"))
        .order_by(func.count(models.Job.id).desc())
        .all()
    )

    jobs_by_type = (
        query.with_entities(models.Job.type, func.count(models.Job.id))
        .group_by(models.Job.type)
        .order_by(func.count(models.Job.id).desc())
        .all()
    )

    top_cities = (
        query.with_entities(models.Job.city, func.count(models.Job.id))
        .group_by(models.Job.city)
        .order_by(func.count(models.Job.id).desc())
        .limit(5)
        .all()
    )

    top_companies = (
        query.with_entities(models.Job.company, func.count(models.Job.id))
        .group_by(models.Job.company)
        .order_by(func.count(models.Job.id).desc())
        .limit(5)
        .all()
    )

    jobs_by_date = (
        query.with_entities(
            func.date(models.Job.created_at),
            func.count(models.Job.id)
        )
        .filter(models.Job.created_at.is_not(None))
        .group_by(func.date(models.Job.created_at))
        .order_by(func.date(models.Job.created_at).asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Section", "Metric", "Value"])

    writer.writerow(["Summary", "Total Jobs", total_jobs])
    writer.writerow(["Summary", "Total Companies", total_companies])
    writer.writerow(["Summary", "Manual Jobs", manual_jobs])
    writer.writerow(["Summary", "Remotive Jobs", remotive_jobs])
    writer.writerow(["Summary", "Platform Jobs", platform_jobs])
    writer.writerow(["Summary", "Remote Jobs", remote_jobs])
    writer.writerow(["Summary", "Hybrid Jobs", hybrid_jobs])
    writer.writerow(["Summary", "Onsite Jobs", onsite_jobs])

    writer.writerow([])
    writer.writerow(["Jobs By Source", "Source", "Count"])

    for source_name, count in jobs_by_source:
        writer.writerow(["Jobs By Source", source_name, count])

    writer.writerow([])
    writer.writerow(["Jobs By Type", "Type", "Count"])

    for job_type, count in jobs_by_type:
        writer.writerow(["Jobs By Type", job_type, count])

    writer.writerow([])
    writer.writerow(["Top Cities", "City", "Count"])

    for city, count in top_cities:
        writer.writerow(["Top Cities", city, count])

    writer.writerow([])
    writer.writerow(["Top Companies", "Company", "Count"])

    for company, count in top_companies:
        writer.writerow(["Top Companies", company, count])

    writer.writerow([])
    writer.writerow(["Jobs By Date", "Date", "Count"])

    for job_date, count in jobs_by_date:
        writer.writerow(["Jobs By Date", job_date, count])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=mihna_analytics_export.csv"
        }
    )