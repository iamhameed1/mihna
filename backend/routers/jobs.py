import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db, get_current_user, require_company_user
from utils import apply_job_filters


router = APIRouter(tags=["Jobs"])


@router.get("/jobs", response_model=schemas.JobsPageResponse)
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
        query = query.order_by(
            models.Job.created_at.asc().nullslast(),
            models.Job.id.asc()
        )
    elif sort == "company_az":
        query = query.order_by(models.Job.company.asc())
    elif sort == "title_az":
        query = query.order_by(models.Job.title.asc())
    else:
        query = query.order_by(
            models.Job.created_at.desc().nullslast(),
            models.Job.id.desc()
        )

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


@router.get("/jobs/{job_id:int}", response_model=schemas.JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(models.Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/export/csv")
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


@router.post("/jobs", response_model=schemas.JobResponse)
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


@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).with_for_update().first()

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

    # Lock the job first so a concurrent save cannot add a new reference
    # between removing bookmarks and deleting the job.
    try:
        db.query(models.SavedJob).filter(models.SavedJob.job_id == job.id).delete(synchronize_session=False)
        db.delete(job)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"message": "Job deleted successfully"}


@router.put("/jobs/{job_id}", response_model=schemas.JobResponse)
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
