from datetime import datetime, timedelta, timezone
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from auth import create_access_token, decode_access_token, hash_password, verify_password
from bs4 import BeautifulSoup
from sqlalchemy import func

import models
import schemas
from database import SessionLocal, engine
import requests
import csv
import io
from fastapi.responses import StreamingResponse

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
bearer_scheme = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate login token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    email = payload.get("sub")

    if email is None:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if user is None:
        raise credentials_exception

    return user

def require_company_user(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can perform this action"
        )

    return current_user

def require_job_seeker_user(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "job_seeker":
        raise HTTPException(
            status_code=403,
            detail="Only job seeker accounts can save jobs"
        )

    return current_user

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return "No description available."

    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup(["script", "style", "img"]):
        tag.decompose()

    text = soup.get_text(separator="\n")

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    return "\n".join(lines)

def apply_job_filters(
    query,
    search: str | None = None,
    type: str | None = None,
    location: str | None = None,
    source: str | None = None,
    date_range: str | None = None,
):
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            (models.Job.title.ilike(search_value)) |
            (models.Job.company.ilike(search_value)) |
            (models.Job.description.ilike(search_value))
        )

    if type and type != "All":
        query = query.filter(models.Job.type == type)

    if location and location != "All":
        location_value = f"%{location}%"

        query = query.filter(
            (models.Job.country.ilike(location_value)) |
            (models.Job.city.ilike(location_value))
        )

    if source and source != "All":
        if source == "manual":
            query = query.filter(models.Job.source.is_(None))
        else:
            query = query.filter(models.Job.source == source)

    if date_range and date_range != "All":
        now = datetime.now(timezone.utc)

        if date_range == "7d":
            start_date = now - timedelta(days=7)
            query = query.filter(models.Job.created_at >= start_date)

        elif date_range == "30d":
            start_date = now - timedelta(days=30)
            query = query.filter(models.Job.created_at >= start_date)

    return query

@app.get("/")
def home():
    return {"message": "Mihna API is running with PostgreSQL"}


@app.get("/jobs", response_model=schemas.JobsPageResponse)
def get_jobs(
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    location: str | None = Query(default=None),
    source: str | None = Query(default=None),
    date_range: str | None = Query(default=None),
    sort: str | None = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(models.Job)

    query = db.query(models.Job)

    query = apply_job_filters(
    query=query,
    search=search,
    type=type,
    location=location,
    source=source,
    date_range=date_range,
    )
            
    total = query.count()

    total_pages = (total + page_size - 1) // page_size

    if sort == "oldest":
     query = query.order_by(models.Job.created_at.asc().nullslast(), models.Job.id.asc())
    elif sort == "company_az":
        query = query.order_by(models.Job.company.asc())
    elif sort == "title_az":
        query = query.order_by(models.Job.title.asc())
    else:
        query = query.order_by(models.Job.created_at.desc().nullslast(), models.Job.id.desc())

    jobs = (
    query
    .offset((page - 1) * page_size)
    .limit(page_size)
    .all()
    )

    return {
        "items": jobs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

@app.get("/company/jobs", response_model=list[schemas.JobResponse])
def get_company_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    jobs = db.query(models.Job).filter(
        models.Job.owner_id == current_user.id,
        models.Job.source.is_(None)
    ).order_by(models.Job.id.desc()).all()

    return jobs

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

@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    new_job = models.Job(
        **job.model_dump(),
        owner_id=current_user.id
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job

@app.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can delete jobs"
        )

    if job.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own jobs"
        )

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}

@app.put("/jobs/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    updated_job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can update jobs"
        )

    if job.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own jobs"
        )

    job.title = updated_job.title
    job.company = updated_job.company
    job.country = updated_job.country
    job.city = updated_job.city
    job.type = updated_job.type
    job.salary = updated_job.salary
    job.link = updated_job.link
    job.description = updated_job.description

    db.commit()
    db.refresh(job)

    return job

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    valid_roles = ["job_seeker", "company"]

    if user.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Role must be either job_seeker or company"
        )

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/login", response_model=schemas.TokenResponse)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_correct = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "user_id": existing_user.id,
            "role": existing_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": existing_user,
    }

@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/saved-jobs/{job_id}", response_model=schemas.SavedJobResponse)
def save_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_job_seeker_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    existing_saved_job = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id,
        models.SavedJob.job_id == job_id
    ).first()

    if existing_saved_job:
        return existing_saved_job

    saved_job = models.SavedJob(
        user_id=current_user.id,
        job_id=job_id
    )

    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)

    return saved_job

@app.get("/saved-jobs", response_model=list[schemas.JobResponse])
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_job_seeker_user)
):
    saved_jobs = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id
    ).all()

    job_ids = [saved_job.job_id for saved_job in saved_jobs]

    if not job_ids:
        return []

    jobs = db.query(models.Job).filter(
        models.Job.id.in_(job_ids)
    ).order_by(models.Job.id.desc()).all()

    return jobs

@app.delete("/saved-jobs/{job_id}")
def remove_saved_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_job_seeker_user)
):
    saved_job = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id,
        models.SavedJob.job_id == job_id
    ).first()

    if saved_job is None:
        raise HTTPException(status_code=404, detail="Saved job not found")

    db.delete(saved_job)
    db.commit()

    return {"message": "Saved job removed successfully"}

@app.post("/company/fetch-remotive-jobs")
def fetch_remotive_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    ingestion_log = models.IngestionLog(
        source="remotive",
        added_count=0,
        skipped_count=0,
        status="running",
        started_at=datetime.now(timezone.utc),
    )

    db.add(ingestion_log)
    db.commit()
    db.refresh(ingestion_log)

    added_count = 0
    skipped_count = 0

    try:
        response = requests.get(
            "https://remotive.com/api/remote-jobs",
            timeout=20
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Failed to fetch jobs from Remotive"
            )

        data = response.json()
        remote_jobs = data.get("jobs", [])

        for item in remote_jobs[:20]:
            external_id = str(item.get("id"))

            existing_job = db.query(models.Job).filter(
                models.Job.source == "remotive",
                models.Job.external_id == external_id
            ).first()

            if existing_job:
                skipped_count += 1
                continue

            location = item.get("candidate_required_location") or "Remote"
            company = item.get("company_name") or "Unknown Company"
            title = item.get("title") or "Untitled Job"
            link = item.get("url") or "https://remotive.com"
            description = clean_html(item.get("description") or "")

            new_job = models.Job(
            title=title,
            company=company,
            country="Remote",
            city=location,
            type="Remote",
            salary="Not specified",
            link=link,
            description=description,
            owner_id=None,
            source="remotive",
            external_id=external_id,
            )

            db.add(new_job)
            added_count += 1

        ingestion_log.added_count = added_count
        ingestion_log.skipped_count = skipped_count
        ingestion_log.status = "success"
        ingestion_log.finished_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "message": "Remotive jobs fetched successfully",
            "added": added_count,
            "skipped_duplicates": skipped_count,
            "source": "remotive",
            "log_id": ingestion_log.id,
        }

    except Exception as error:
        ingestion_log.added_count = added_count
        ingestion_log.skipped_count = skipped_count
        ingestion_log.status = "failed"
        ingestion_log.error_message = str(error)
        ingestion_log.finished_at = datetime.now(timezone.utc)

        db.commit()

        raise

@app.get("/company/ingestion-logs", response_model=list[schemas.IngestionLogResponse])
def get_ingestion_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    logs = db.query(models.IngestionLog).order_by(
        models.IngestionLog.id.desc()
    ).limit(20).all()

    return logs

@app.get("/jobs/export/csv")
def export_jobs_csv(
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

    jobs = query.order_by(models.Job.created_at.desc().nullslast()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "id",
        "title",
        "company",
        "country",
        "city",
        "type",
        "salary",
        "source",
        "external_id",
        "link",
        "created_at",
    ])

    for job in jobs:
        writer.writerow([
            job.id,
            job.title,
            job.company,
            job.country,
            job.city,
            job.type,
            job.salary,
            job.source or "manual",
            job.external_id or "",
            job.link,
            job.created_at,
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=mihna_jobs_export.csv"
        }
    )